export async function up(knex) {
  await knex.schema.alterTable("users", (table) => {
    table.string("preferred_language").nullable();
  });

  const hasLanguageColumn = await knex.schema.hasColumn("study_sessions", "language");
  if (!hasLanguageColumn) {
    await knex.schema.alterTable("study_sessions", (table) => {
      table.string("language").notNullable().defaultTo("C");
    });
  }
}

export async function down(knex) {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("preferred_language");
  });

  const hasLanguageColumn = await knex.schema.hasColumn("study_sessions", "language");
  if (hasLanguageColumn) {
    await knex.schema.alterTable("study_sessions", (table) => {
      table.dropColumn("language");
    });
  }
}
