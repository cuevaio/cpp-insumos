import { type NextRequest } from 'next/server';

import { and, eq, inArray } from 'drizzle-orm';
import { z, ZodError } from 'zod';

import { db, schema } from '@/db';
import { InsumoInsert } from '@/db/schema';

import {
  HourStringified,
  marketEnumValues,
  noteEnumValues,
} from '@/lib/constants';

const constantFields: (keyof InsumoInsert)[] = [
  'date',
  'unit_id',
  'hour',
  'created_at',
  'updated_at',
];

export const GET = async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;

    const { date, unit_id, market } = z
      .object({
        date: z.string().date(),
        unit_id: z.string().uuid(),
        market: z.enum(marketEnumValues),
      })
      .parse({
        date: searchParams.get('date'),
        unit_id: searchParams.get('unit_id'),
        market: searchParams.get('market'),
      });

    const data = await db
      .select()
      .from(schema.insumo)
      .where(
        and(
          eq(schema.insumo.date, date),
          eq(schema.insumo.unit_id, unit_id),
          eq(schema.insumo.market, market),
        ),
      );

    return Response.json({
      data: {
        date,
        market,
        unit_id,
        insumos: data
          .map((x) => ({
            ...x,
            market: undefined,
            unit_id: undefined,
            date: undefined,
            hour: Number(x.hour),
            min: Number(x.min),
            max: Number(x.max),
            share_ft1: x.share_ft1 ? Number(x.share_ft1) : null,
            share_ft2: x.share_ft2 ? Number(x.share_ft2) : null,
            price_ft1: Number(x.price_ft1),
            price_ft2: x.price_ft2 ? Number(x.price_ft2) : null,
          }))
          .toSorted((a, b) => a.hour - b.hour),
      },
    });
  } catch (error) {
    console.log(error);
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    return Response.json(
      { error: 'Something went wrong, man' },
      { status: 500 },
    );
  }
};

export const POST = async (request: Request) => {
  try {
    const body = await request.json();

    const data = bodySchema.parse(body);

    const existingInsumos = await db
      .select()
      .from(schema.insumo)
      .where(
        and(
          eq(schema.insumo.date, data.date),
          eq(schema.insumo.unit_id, data.unit_id),
          eq(schema.insumo.market, data.market),
          inArray(
            schema.insumo.hour,
            data.insumos.map((x) => x.hour),
          ),
        ),
      );
    const toInsert: InsumoInsert[] = [];
    const toUpdate: InsumoInsert[] = [];

    data.insumos.forEach((newInsumo) => {
      const existing = existingInsumos.find((x) => x.hour === newInsumo.hour);

      if (!existing) {
        toInsert.push({
          unit_id: data.unit_id,
          date: data.date,
          ...newInsumo,
        });
      } else {
        Object.keys(newInsumo).some((key) => {
          if (!constantFields.includes(key as keyof InsumoInsert)) {
            if (
              existing[key as keyof InsumoInsert] !==
              newInsumo[key as keyof typeof newInsumo]
            ) {
              toUpdate.push({
                unit_id: data.unit_id,
                date: data.date,
                ...newInsumo,
                updated_at: new Date(),
              });
              return true;
            }
          }
        });
      }
    });

    if (toInsert.length > 0) {
      await db.insert(schema.insumo).values(toInsert);
    }

    if (toUpdate.length > 0) {
      await Promise.all(
        toUpdate.map((insumo) =>
          db
            .update(schema.insumo)
            .set(insumo)
            .where(
              and(
                eq(schema.insumo.date, insumo.date),
                eq(schema.insumo.unit_id, insumo.unit_id),
                eq(schema.insumo.hour, insumo.hour),
              ),
            ),
        ),
      );
    }

    return Response.json({
      data: {
        inserted: toInsert.map((x) => Number(x.hour)),
        updated: toUpdate.map((x) => Number(x.hour)),
      },
    });
  } catch (error) {
    console.log(error);
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    return Response.json(
      { error: 'Something went wrong, man' },
      { status: 500 },
    );
  }
};

const noteEnumZod = z.enum(noteEnumValues);

const bodySchema = z.object({
  date: z.string().date(),
  unit_id: z.string().uuid(),
  market: z.enum(marketEnumValues),
  insumos: z.array(
    z.object({
      hour: z
        .number()
        .min(1)
        .max(25)
        .transform((x) => x.toString() as HourStringified),
      min: z
        .number()
        .min(0)
        .max(1000)
        .transform((x) => x.toFixed(3)),
      max: z
        .number()
        .min(0)
        .max(1000)
        .transform((x) => x.toFixed(3)),
      share_ft1: z
        .number()
        .min(0)
        .max(1)
        .nullish()
        .transform((x) => x?.toFixed(3) ?? null),
      share_ft2: z
        .number()
        .min(0)
        .max(1)
        .nullish()
        .transform((x) => x?.toFixed(3) ?? null),
      note: noteEnumZod,
      agc: z
        .boolean()
        .nullish()
        .transform((x) => Boolean(x)),
      price_ft1: z
        .number()
        .min(0)
        .max(1000)
        .transform((x) => x?.toFixed(3) ?? null),
      price_ft2: z
        .number()
        .min(0)
        .max(1000)
        .nullish()
        .transform((x) => x?.toFixed(3) ?? null),
    }),
  ),
});
