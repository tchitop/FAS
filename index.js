const { default: makeWASocket, useSingleFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require("@adiwajshing/baileys");
const qrcode = require("qrcode-terminal");
const chalk = require("chalk");
const fs = require("fs");

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

async function startBot() {
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrcode.generate(qr, { small: true });
            console.log(chalk.green("Scan den QR-Code mit WhatsApp"));
        }
        if (connection === 'close') {
            const reason = lastDisconnect.error?.output?.statusCode;
            console.log(chalk.red("Disconnected: " + reason));
            if (reason !== DisconnectReason.loggedOut) startBot();
        }
        if (connection === 'open') {
            console.log(chalk.blue("✅ Connected!"));
            showMenu();
        }
    });

    sock.ev.on('creds.update', saveState);

    sock.ev.on('messages.upsert', async (msg) => {
        const message = msg.messages[0];
        if (!message.message?.conversation) return;
        const text = message.message.conversation;

        // Commands mit !
        if (text.startsWith("!")) {
            const command = text.slice(1).split(" ")[0];
            const args = text.slice(1).split(" ").slice(1);

            switch(command.toLowerCase()) {
                case "ping":
                    await sock.sendMessage(message.key.remoteJid, { text: "Pong!" });
                    break;
                case "say":
                    await sock.sendMessage(message.key.remoteJid, { text: args.join(" ") });
                    break;
                case "ascii":
                    await sock.sendMessage(message.key.remoteJid, { text: `
███████╗ █████╗ ███████╗
██╔════╝██╔══██╗██╔════╝
█████╗  ███████║███████╗
██╔══╝  ██╔══██║╚════██║
██║     ██║  ██║███████║
╚═╝     ╚═╝  ╚═╝╚══════╝
                    `});
                    break;
                default:
                    await sock.sendMessage(message.key.remoteJid, { text: "❌ Unknown command!" });
            }
        }
    });
}

// ASCII Menü
function showMenu() {
    console.log(chalk.yellow(`
================ WHATSAPP SELFBOT ================
!ping   → Test bot
!say    → Sende Nachricht
!ascii  → Zeige ASCII Banner
================================================
    `));
}

startBot();
