import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.vms.app",
  appName: "vms",
  webDir: "public",
  server: {
    // url: "http://localhost:3000",
    // url: "http://192.168.0.102:3000",
    // url: "https://ealpa.esparsh.in/vmsapp/",https://vms-vercel.vercel.app/vmsapp/
    url: "https://vms-vercel.vercel.app/vmsapp/",

    cleartext: true,
  },
  plugins: {
    Camera: {
      permissions: ["camera"],
    },
    Filesystem: {
      directory: "DOCUMENTS",
    },
    EdgeToEdge: {
      backgroundColor: "#ffffff", // optional: sets status + nav bar background on Android
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    adjustMarginsForEdgeToEdge: "force",
  },
};

export default config;
