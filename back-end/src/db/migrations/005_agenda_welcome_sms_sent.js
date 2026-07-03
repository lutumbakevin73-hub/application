export async function up(knex) {
  const hasColumn = await knex.schema.hasColumn("agendas", "welcome_sms_sent");
  if (!hasColumn) {
    await knex.schema.alterTable("agendas", (table) => {
      table.boolean("welcome_sms_sent").notNullable().defaultTo(false);
    });
  }
}

export async function down(knex) {
  const hasColumn = await knex.schema.hasColumn("agendas", "welcome_sms_sent");
  if (hasColumn) {
    await knex.schema.alterTable("agendas", (table) => {
      table.dropColumn("welcome_sms_sent");
    });
  }
}
