import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { HtmlToTextTransformer } from "langchain/document_transformers/html_to_text";
import { HuggingFaceTransformersEmbeddings } from "langchain/embeddings/hf_transformers";
import { SupabaseHybridSearch } from "langchain/retrievers/supabase";

export type SaveLinkRequest = {
  Body: {
    url: string;
    content: string;
  };
};

export type SearchLinkRequest = {
  Body: {
    query: string;
    count?: number;
  };
};

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.post(
    "/save",
    async function (request: FastifyRequest<SaveLinkRequest>, reply) {
      const supabase = request.server.supabase;
      const { url, content } = request.body;
      
      const docs = [
        new Document({
          pageContent: content,
          metadata: {
            url: url,
          },
        }),
      ];

      const splitter = RecursiveCharacterTextSplitter.fromLanguage("html");
      const transformer = new HtmlToTextTransformer();

      const sequence = splitter.pipe(transformer);
      const newDocuments = await sequence.invoke(docs);

      const model = new HuggingFaceTransformersEmbeddings({
        modelName: "Supabase/gte-small",
      });

      for (const doc of newDocuments) {
        if (doc.pageContent) {
          const embeddings = await model.embedDocuments([doc.pageContent]);
          const { error } = await supabase
            .from("documents")
            .insert([{
              url,
              content: doc.pageContent,
              embedding: JSON.stringify(embeddings[0]),
              metadata: JSON.stringify(doc.metadata),
            }]);

          if (error) {
            return reply.status(500).send(error);
          }
        }
      }

      return {
        "message": "success",
      };
    },
  );

  fastify.post(
    "/search",
    async function (request: FastifyRequest<SearchLinkRequest>, reply) {
      const limit = request.body.count || 3;
      const supabase = request.server.supabase;

      const embeddings = new HuggingFaceTransformersEmbeddings({
        modelName: "Supabase/gte-small",
      });
      const retriever = new SupabaseHybridSearch(embeddings, {
        similarityK: limit,
        keywordK: limit,
        tableName: "documents",
        similarityQueryName: "match_documents",
        keywordQueryName: "kw_match_documents",
        client: supabase,
      });

      const results = await retriever.getRelevantDocuments(request.body.query);

      return {
        results,
      };
    },
  );
};

export default root;
