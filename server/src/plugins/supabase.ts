import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

declare module "fastify" {
  interface FastifyInstance {
    supabase: SupabaseClient;
  }
}
const supabasePlugin: FastifyPluginAsync = fp(async (server, options) => {
  console.log("Connecting to Supabase");

  const supabaseUrl = process.env.SUPABASE_PUBLIC_URL!;
  const supabaseKey = process.env.SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  server.decorate("supabase", supabase);
  server.addHook("onClose", async (server) => {
    server.log.info("Supabase connection closed.");
  });
});

export default supabasePlugin;
