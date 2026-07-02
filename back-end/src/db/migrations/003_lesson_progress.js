export async function up(knex) {
  await knex.schema.createTable("lesson_progress", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("program_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("study_programs")
      .onDelete("CASCADE");
    table.json("completed").notNullable().defaultTo("[]");
    table.json("quiz_attempts").nullable();
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.unique(["user_id", "program_id"]);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("lesson_progress");
}
