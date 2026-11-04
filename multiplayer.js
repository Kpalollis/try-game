(() => {
  const sdkUrl = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  let client = null;
  let channel = null;
  let roomCode = "";
  let playerId = "";
  let role = "";
  let opponentId = "";
  let players = [];
  let lastOpponentId = "";
  let messageHandler = () => {};
  let statusHandler = () => {};

  function reportStatus(error = "") {
    statusHandler({
      connected: Boolean(channel),
      roomCode,
      playerId,
      role,
      isHost: role === "host",
      opponentId,
      players: players.length,
      error
    });
  }

  async function loadSdk() {
    if (window.supabase?.createClient) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = sdkUrl;
      script.async = true;
      script.onload = () => window.supabase?.createClient
        ? resolve()
        : reject(new Error("Supabase SDK loaded without createClient."));
      script.onerror = () => reject(new Error("Unable to load the Supabase SDK."));
      document.head.append(script);
    });
  }

  async function getClient() {
    const config = window.SUPABASE_CONFIG;
    if (!config?.url || !config?.anonKey) {
      throw new Error("Add your Supabase project URL and anon key to supabase-config.js first.");
    }
    if (!client) {
      await loadSdk();
      client = window.supabase.createClient(config.url, config.anonKey);
    }
    return client;
  }

  function updatePresence() {
    const state = channel?.presenceState() || {};
    players = Object.values(state).flat().filter(player => typeof player.playerId === "string");
    const byJoinOrder = (left, right) =>
      (Number.isFinite(left.joinedAt) ? left.joinedAt : Infinity) -
        (Number.isFinite(right.joinedAt) ? right.joinedAt : Infinity) ||
      left.playerId.localeCompare(right.playerId);
    const admittedPlayers = ["host", "guest"]
      .map(playerRole => players.filter(player => player.role === playerRole).sort(byJoinOrder)[0])
      .filter(Boolean);
    const host = admittedPlayers.find(player => player.role === "host");
    const guest = admittedPlayers.find(player => player.role === "guest");
    opponentId = role === "host" ? guest?.playerId || "" : host?.playerId || "";
    reportStatus();
    if (opponentId && opponentId !== lastOpponentId) {
      lastOpponentId = opponentId;
      void send("hello", {}).catch(error => reportStatus(error.message));
    } else if (!opponentId) {
      lastOpponentId = "";
    }
    if (players.length > admittedPlayers.length && !admittedPlayers.some(player => player.playerId === playerId)) {
      void leave()
        .then(() => reportStatus("This room is full or already has a player in your role."))
        .catch(error => reportStatus(error.message));
    }
  }

  async function leave() {
    const previous = channel;
    channel = null;
    roomCode = "";
    playerId = "";
    role = "";
    opponentId = "";
    players = [];
    lastOpponentId = "";
    if (previous && client) await client.removeChannel(previous);
    reportStatus();
  }

  async function connect(code, playerRole) {
    if (!/^[A-Z0-9]{8,16}$/.test(code)) throw new Error("Room codes must be 8–16 letters or numbers.");
    await leave();
    const supabase = await getClient();
    roomCode = code;
    role = playerRole;
    playerId = crypto.randomUUID();
    const currentRoom = code;
    const currentPlayerId = playerId;
    channel = supabase.channel(`tactics-room:${currentRoom}`, {
      config: {
        broadcast: { ack: true, self: false },
        presence: { key: currentPlayerId }
      }
    });
    channel
      .on("broadcast", { event: "game" }, ({ payload }) => {
        if (payload?.roomCode !== currentRoom || payload?.from === currentPlayerId) return;
        if (typeof payload.type !== "string" || typeof payload.from !== "string") return;
        messageHandler(payload.type, payload.data, payload.from);
      })
      .on("presence", { event: "sync" }, updatePresence);

    let subscribed = false;
    try {
      await new Promise((resolve, reject) => {
        channel.subscribe(async status => {
          if (status === "SUBSCRIBED") {
            try {
              await channel.track({
                playerId: currentPlayerId,
                role: playerRole,
                joinedAt: performance.timeOrigin + performance.now()
              });
              updatePresence();
              subscribed = true;
              resolve();
            } catch (error) {
              reportStatus(error.message);
              reject(error);
            }
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            const error = new Error(`Supabase channel connection failed: ${status}.`);
            if (subscribed) {
              void leave()
                .then(() => reportStatus(error.message))
                .catch(cleanupError => reportStatus(cleanupError.message));
            } else {
              reportStatus(error.message);
              reject(error);
            }
          }
        });
      });
    } catch (error) {
      await leave();
      throw error;
    }
    if (!channel || playerId !== currentPlayerId) {
      throw new Error("This room is full or already has a player in your role.");
    }
    await send("hello", {});
    return { roomCode, playerId };
  }

  async function send(type, data) {
    if (!channel || !roomCode || !playerId) throw new Error("You are not connected to a multiplayer room.");
    const result = await channel.send({
      type: "broadcast",
      event: "game",
      payload: { roomCode, from: playerId, type, data }
    });
    if (result !== "ok") throw new Error(`Supabase did not send the ${type} message: ${result}.`);
  }

  window.multiplayerClient = {
    createRoom: async () => {
      const code = crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
      await connect(code, "host");
      return code;
    },
    joinRoom: code => connect(code.trim().toUpperCase(), "guest"),
    leave,
    send,
    setHandlers: (onMessage, onStatus) => {
      messageHandler = onMessage;
      statusHandler = onStatus;
    },
    get connected() { return Boolean(channel); },
    get isHost() { return role === "host"; },
    get playerId() { return playerId; },
    get opponentId() { return opponentId; },
    get roomCode() { return roomCode; },
    get playerCount() { return players.length; }
  };
})();
