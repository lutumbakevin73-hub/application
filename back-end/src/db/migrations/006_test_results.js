export async function up(knex) {
  await knex.schema.createTable("test_results", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .unique()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.integer("score").notNullable();
    table.integer("correct_count").notNullable();
    table.integer("total_count").notNullable();
    table.string("language").nullable();
    table.string("recommended_program").notNullable();
    table.json("weak_themes").notNullable();
    table.json("by_theme").notNullable();
    table.json("by_language").nullable();
    table.json("details").nullable();
    table.timestamp("completed_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("test_results");
}
