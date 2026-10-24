/**
 * Two browsers share one game through a public MQTT broker.
 * The room id in the invite link is the only secret.
 */

export type Seat = "X" | "O" | "Y" | "Z";

export type MatchNote = {
  kind: "hi" | "go" | "say";
  id: string;
  seat: Seat;
  at: number;
  moves: string[];
  times: Array<number | null>;
  epoch: number;
  white: string;
  resign: Seat | null;
  flag: Seat | null;
  minutes: number;
  clock: { X: number; O: number; Y?: number; Z?: number } | null;
  running: boolean;
  size: 8 | 13;
  text: string;
  alt: string;
};

/** Room names are short words. Older hex codes still count. */
export function isRoomName(room: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/.test(room) && room.length >= 2 && room.length <= 32;
}

export type MatchLink = {
  publish: (note: MatchNote) => void;
  close: () => void;
};

const BROKERS = [
  "wss://broker.hivemq.com:8884/mqtt",
  "wss://broker.emqx.io:8084/mqtt",
];

export function connectMatch(
  room: string,
  onNote: (note: MatchNote) => void,
  onLink: (up: boolean) => void,
): MatchLink {
  if (!isRoomName(room)) {
    onLink(false);
    return { publish() {}, close() {} };
  }

  const topic = `eireq/hexo/${room}`;
  let socket: WebSocket | null = null;
  let closed = false;
  let up = false;
  let attempt = 0;
  let retry = 0;
  let generation = 0;
  let ping: ReturnType<typeof setInterval> | 0 = 0;
  let reconnect: ReturnType<typeof setTimeout> | 0 = 0;
  let buffer = new Uint8Array(0);

  const sendPacket = (packet: Uint8Array) => {
    if (socket && socket.readyState === WebSocket.OPEN) socket.send(packet);
  };

  const fail = () => {
    up = false;
    onLink(false);
    clearInterval(ping);
    if (closed) return;
    const wait = Math.min(8000, 700 * 2 ** Math.min(retry, 4));
    retry += 1;
    clearTimeout(reconnect);
    reconnect = setTimeout(open, wait);
  };

  const open = () => {
    if (closed) return;
    const mine = ++generation;
    const broker = BROKERS[attempt % BROKERS.length];
    attempt += 1;
    buffer = new Uint8Array(0);
    try {
      socket = new WebSocket(broker, ["mqtt"]);
    } catch {
      fail();
      return;
    }
    socket.binaryType = "arraybuffer";
    socket.onopen = () => {
      if (mine !== generation) return;
      const bytes = new Uint8Array(5);
      crypto.getRandomValues(bytes);
      const id = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
      sendPacket(connectPacket(`h${id}`));
    };
    socket.onmessage = (event) => {
      if (mine !== generation) return;
      const chunk = new Uint8Array(event.data as ArrayBuffer);
      const next = new Uint8Array(buffer.length + chunk.length);
      next.set(buffer);
      next.set(chunk, buffer.length);
      buffer = next;
      drain();
    };
    socket.onclose = () => {
      if (mine !== generation) return;
      fail();
    };
  };

  const drain = () => {
    for (;;) {
      const packet = readPacket();
      if (!packet) return;
      const type = packet[0] >> 4;
      if (type === 2) {
        sendPacket(subscribePacket(topic));
      } else if (type === 9) {
        up = true;
        retry = 0;
        onLink(true);
        clearInterval(ping);
        ping = setInterval(() => sendPacket(pingPacket()), 20000);
      } else if (type === 3) {
        const note = readPublish(packet);
        if (note) onNote(note);
      }
    }
  };

  const readPacket = (): Uint8Array | null => {
    if (buffer.length < 2) return null;
    let multiplier = 1;
    let length = 0;
    let offset = 1;
    for (let i = 0; i < 4; i += 1) {
      if (offset >= buffer.length) return null;
      const byte = buffer[offset];
      offset += 1;
      length += (byte & 127) * multiplier;
      multiplier *= 128;
      if ((byte & 128) === 0) break;
      if (i === 3) return null;
    }
    if (buffer.length < offset + length) return null;
    const packet = buffer.slice(0, offset + length);
    buffer = buffer.slice(offset + length);
    return packet;
  };

  open();

  return {
    publish(note) {
      if (!up) return;
      sendPacket(publishPacket(topic, JSON.stringify(note), note.kind === "go" && note.epoch >= 1));
    },
    close() {
      closed = true;
      up = false;
      generation += 1;
      clearInterval(ping);
      clearTimeout(reconnect);
      socket?.close();
      socket = null;
    },
  };
}

function readPublish(packet: Uint8Array): MatchNote | null {
  let offset = 1;
  let multiplier = 1;
  for (let i = 0; i < 4; i += 1) {
    const byte = packet[offset];
    offset += 1;
    multiplier *= 128;
    if ((byte & 128) === 0) break;
    if (i === 3) return null;
  }
  void multiplier;
  if (offset + 2 > packet.length) return null;
  const topicLength = (packet[offset] << 8) | packet[offset + 1];
  offset += 2 + topicLength;
  if (offset > packet.length) return null;
  try {
    const text = new TextDecoder().decode(packet.slice(offset));
    return parseNote(JSON.parse(text));
  } catch {
    return null;
  }
}

function parseNote(value: unknown): MatchNote | null {
  if (!value || typeof value !== "object") return null;
  const note = value as Partial<MatchNote>;
  if ((note.kind !== "hi" && note.kind !== "go" && note.kind !== "say") || typeof note.id !== "string") return null;
  if (note.seat !== "X" && note.seat !== "O" && note.seat !== "Y" && note.seat !== "Z") return null;
  const text = typeof note.text === "string" ? note.text.replace(/\s+/g, " ").trim().slice(0, 160) : "";
  if (note.kind === "say" && !text) return null;
  const moves = Array.isArray(note.moves) ? note.moves.filter((move) => typeof move === "string") : [];
  if (note.kind !== "say" && (!Array.isArray(note.moves) || moves.length !== note.moves.length)) return null;
  const clock = note.clock;
  const safeClock =
    clock &&
    typeof clock === "object" &&
    typeof clock.X === "number" &&
    typeof clock.O === "number"
      ? {
          X: clock.X,
          O: clock.O,
          ...(typeof clock.Y === "number" ? { Y: clock.Y } : {}),
          ...(typeof clock.Z === "number" ? { Z: clock.Z } : {}),
        }
      : null;
  const side = (value: unknown): Seat | null =>
    value === "X" || value === "O" || value === "Y" || value === "Z" ? value : null;
  const alt = typeof note.alt === "string" ? note.alt.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80) : "";
  return {
    kind: note.kind,
    id: note.id,
    seat: note.seat,
    at: typeof note.at === "number" ? note.at : Date.now(),
    moves,
    times: Array.isArray(note.times)
      ? note.times.map((time) => (typeof time === "number" ? time : null))
      : [],
    epoch: typeof note.epoch === "number" && note.epoch > 0 ? Math.floor(note.epoch) : 0,
    white: typeof note.white === "string" ? note.white : "",
    resign: side(note.resign),
    flag: side(note.flag),
    minutes: note.minutes === 5 || note.minutes === 10 ? note.minutes : 0,
    clock: safeClock,
    running: Boolean(note.running),
    size: note.size === 13 ? 13 : 8,
    text,
    alt,
  };
}

function connectPacket(clientId: string): Uint8Array {
  const id = utf8(clientId);
  const body = [0x00, 0x04, 0x4d, 0x51, 0x54, 0x54, 0x04, 0x02, 0x00, 0x1e, ...id];
  return packet(0x10, body);
}

function subscribePacket(topic: string): Uint8Array {
  const filter = utf8(topic);
  return packet(0x82, [0x00, 0x01, ...filter, 0x00]);
}

function publishPacket(topic: string, payload: string, retain = false): Uint8Array {
  const body = [...utf8(topic), ...new TextEncoder().encode(payload)];
  return packet(retain ? 0x31 : 0x30, body);
}

function pingPacket(): Uint8Array {
  return Uint8Array.from([0xc0, 0x00]);
}

function packet(header: number, body: number[]): Uint8Array {
  return Uint8Array.from([header, ...remaining(body.length), ...body]);
}

function utf8(text: string): number[] {
  const bytes = new TextEncoder().encode(text);
  return [bytes.length >> 8, bytes.length & 0xff, ...bytes];
}

function remaining(length: number): number[] {
  const out: number[] = [];
  do {
    let byte = length % 128;
    length = Math.floor(length / 128);
    if (length > 0) byte |= 0x80;
    out.push(byte);
  } while (length > 0);
  return out;
}
