import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  decimal,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import {
  hoursStringified,
  marketEnumValues,
  noteEnumValues,
} from '@/lib/constants';

export const hourEnum = pgEnum('hour_enum', hoursStringified);

export const noteEnum = pgEnum('note_enum', noteEnumValues);
export const marketEnum = pgEnum('market_enum', marketEnumValues);

export const insumo = pgTable(
  'insumo',
  {
    date: date('date').notNull(),
    unit_id: uuid('unit_id').notNull(),
    market: marketEnum('market').notNull().default('MDA'),
    hour: hourEnum('hour').notNull(),
    min: decimal('min', { precision: 7, scale: 3 }).notNull(),
    max: decimal('max', { precision: 7, scale: 3 }).notNull(),
    share_ft1: decimal('share_ft1', { precision: 4, scale: 3 }),
    share_ft2: decimal('share_ft2', { precision: 4, scale: 3 }),
    note: noteEnum('note').notNull(),
    agc: boolean('agc').notNull().default(false),
    price_ft1: decimal('price_ft1', { precision: 7, scale: 3 }).notNull(),
    price_ft2: decimal('price_ft2', { precision: 7, scale: 3 }),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    {
      pk: primaryKey({
        columns: [table.date, table.unit_id, table.hour, table.market],
      }),

      minCheckConstraint: check(
        'min_check',
        sql`${table.min} >= 0 AND ${table.min} <= 1000.000`,
      ),
      maxCheckConstraint: check(
        'max_check',
        sql`${table.max} >= 0 AND ${table.max} <= 1000.000`,
      ),
      shareFt1CheckConstraint: check(
        'share_ft1_check',
        sql`${table.share_ft1} >= 0 AND ${table.share_ft1} <= 1.000`,
      ),
      shareFt2CheckConstraint: check(
        'share_ft2_check',
        sql`${table.share_ft2} >= 0 AND ${table.share_ft2} <= 1.000`,
      ),
      priceFt1CheckConstraint: check(
        'price_ft1_check',
        sql`${table.price_ft1} >= 0 AND ${table.price_ft1} <= 1000.000`,
      ),
      priceFt2CheckConstraint: check(
        'price_ft2_check',
        sql`${table.price_ft2} >= 0 AND ${table.price_ft2} <= 1000.000`,
      ),
    },
  ],
);

export type InsumoInsert = typeof insumo.$inferInsert;
