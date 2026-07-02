export async function up(knex) {
  const hasColumn = await knex.schema.hasColumn("study_programs", "program");
  if (!hasColumn) {
    await knex.schema.alterTable("study_programs", (table) => {
      table.string("program").notNullable().defaultTo("prog2");
    });
  }
}

export async function down(knex) {
  const hasColumn = await knex.schema.hasColumn("study_programs", "program");
  if (hasColumn) {
    await knex.schema.alterTable("study_programs", (table) => {
      table.dropColumn("program");
    });
  }
}
