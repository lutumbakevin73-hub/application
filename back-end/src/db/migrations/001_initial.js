export async function up(knex) {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("username").notNullable().unique();
    table.string("email").notNullable().unique();
    table.string("password").nullable();
    table.string("role").notNullable().defaultTo("user");
    table.boolean("has_passed_test").notNullable().defaultTo(false);
    table.string("reset_token").nullable();
    table.timestamp("reset_token_expire").nullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("questions", (table) => {
    table.increments("id").primary();
    table.string("type").notNullable();
    table.string("language").notNullable();
    table.string("theme").notNullable();
    table.text("question").notNullable();
    table.json("options").nullable();
    table.text("correct_answer").notNullable();
  });

  await knex.schema.createTable("study_programs", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.json("weak_themes").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("study_sessions", (table) => {
    table.increments("id").primary();
    table
      .integer("program_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("study_programs")
      .onDelete("CASCADE");
    table.integer("session_order").notNullable();
    table.string("theme").notNullable();
    table.json("lesson").notNullable();
    table.json("exercise").notNullable();
    table.json("mini_quiz").notNullable();
  });

  await knex.schema.createTable("agendas", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table.string("phone").notNullable();
    table.string("program").notNullable();
    table.json("sessions").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("agendas");
  await knex.schema.dropTableIfExists("study_sessions");
  await knex.schema.dropTableIfExists("study_programs");
  await knex.schema.dropTableIfExists("questions");
  await knex.schema.dropTableIfExists("users");
}
