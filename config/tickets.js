module.exports = {

  // =========================================
  // 🧱 CORE CHANNELS
  // =========================================

  categoryId: "1456402234798641374",
  logChannelId: "1468013210446594280",

  // =========================================
  // 🎟 WHO CAN USE TICKET COMMANDS
  // =========================================

  adminRoles: [
    "1468294909420240917", // Blueberry Overlord
    "1468294685452927059"  // Administrator
  ],

  modRoles: [
    "1468292177397285037", // Senior Moderator
    "1468294406363680800", // Moderator
    "1455544392415842500"  // Trial Mod
    "1470536730779062433", // Growth Manager
    "1468294094403928348" // Event Team
  ],

  // =========================================
  // 🔐 ACCESS PER TICKET TYPE
  // =========================================

  permissions: {

    partner: {
      viewRoles: [
        "1468294909420240917", // Blueberry Overlord
        "1468294685452927059", // Admin
        "1468292177397285037", // Senior Moderator
        "1470536730779062433" // Growth Manager
      ],
      name: "Partner"
    },

    creator: {
      viewRoles: [
        "1468294909420240917", // Blueberry Overlord
        "1468294685452927059", // Admin
        "1470536730779062433", // Growth Manager
        "1468294094403928348" // Event Team
      ],
      name: "Creator"
    },

    staff: {
      viewRoles: [
        "1468294909420240917", // Blueberry Overlord
        "1468294685452927059" // Admin
      ],
      name: "Staff Apps"
    },

    other: {
      viewRoles: [
        "1468294909420240917", // Blueberry Overlord
        "1468294685452927059", // Admin
        "1470536730779062433", // Growth Manager
        "1468294094403928348", // Event Team
        "1468292177397285037", // Senior Moderator
        "1468294406363680800", // Moderator
        "1455544392415842500"  // Trial Mod
      ],
      name: "Other"
    }

  },

  // =========================================
  // ⚙ SYSTEM BEHAVIOUR
  // =========================================

  settings: {
    maxOpenTicketsPerUser: 1,

    naming: {
      prefix: "ticket",
      separator: "-"
    },

    autoPingOnCreate: true,

    transcriptOnClose: true
  }

};
