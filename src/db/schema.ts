import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  primaryKey,
  index,
  uniqueIndex,
  jsonb,
  real,
} from "drizzle-orm/pg-core";

// ─── NextAuth required tables ──────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  githubAccessToken: text("github_access_token"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    compoundKey: primaryKey({ columns: [table.provider, table.providerAccountId] }),
    userIdIdx: index("accounts_user_id_idx").on(table.userId),
  })
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
  })
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({ columns: [table.identifier, table.token] }),
  })
);

// ─── Application tables ────────────────────────────────────────────────────

export const conversations = pgTable(
  "conversations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    repoFullName: text("repo_full_name").notNull(),
    repoOwner: text("repo_owner").notNull(),
    repoName: text("repo_name").notNull(),
    repoBranch: text("repo_branch").notNull(),
    repoLanguage: text("repo_language"),
    repoPrivate: boolean("repo_private").default(false).notNull(),
    pinned: boolean("pinned").default(false).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    userIdIdx: index("conversations_user_id_idx").on(table.userId),
    userUpdatedIdx: index("conversations_user_updated_idx").on(table.userId, table.updatedAt),
    userRepoIdx: index("conversations_user_repo_idx").on(table.userId, table.repoFullName),
  })
);

export const messages = pgTable(
  "messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    convIdIdx: index("messages_conversation_id_idx").on(table.conversationId),
    convCreatedIdx: index("messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt
    ),
  })
);

export const repositoryPreferences = pgTable(
  "repository_preferences",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    repoFullName: text("repo_full_name").notNull(),
    repoOwner: text("repo_owner").notNull(),
    repoName: text("repo_name").notNull(),
    repoBranch: text("repo_branch").notNull(),
    repoLanguage: text("repo_language"),
    repoPrivate: boolean("repo_private").default(false).notNull(),
    pinned: boolean("pinned").default(false).notNull(),
    lastUsedAt: timestamp("last_used_at", { mode: "date" }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    userRepoUnique: uniqueIndex("repo_prefs_user_repo_unique").on(table.userId, table.repoFullName),
    userIdIdx: index("repo_prefs_user_id_idx").on(table.userId),
    userLastUsedIdx: index("repo_prefs_last_used_idx").on(table.userId, table.lastUsedAt),
  })
);

export const userSettings = pgTable("user_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").default("system").notNull(),
  aiModel: text("ai_model").default("gemini-2.5-flash").notNull(),
  sidebarOpen: boolean("sidebar_open").default(true).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
});

// ─── RAG: repository chunk embeddings ─────────────────────────────────────

export const repoChunks = pgTable(
  "repo_chunks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // Scope to a user so private repo data stays isolated
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    repoFullName: text("repo_full_name").notNull(),
    repoBranch: text("repo_branch").notNull(),
    // Source file path + chunk index within that file
    filePath: text("file_path").notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    // Raw text of this chunk
    content: text("content").notNull(),
    // Embedding stored as JSONB array of floats
    embedding: jsonb("embedding").notNull().$type<number[]>(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    userRepoIdx: index("repo_chunks_user_repo_idx").on(table.userId, table.repoFullName),
    userRepoBranchIdx: index("repo_chunks_user_repo_branch_idx").on(
      table.userId,
      table.repoFullName,
      table.repoBranch
    ),
  })
);

// ─── Inferred types ────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type RepositoryPreference = typeof repositoryPreferences.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type RepoChunk = typeof repoChunks.$inferSelect;
export type NewRepoChunk = typeof repoChunks.$inferInsert;
