import * as z from 'zod';

function validateQueryParams(searchParams, schema) {
  const params = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    const zodError = result.error;
    const issues = zodError.issues || [];
    const errors = issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return {
      success: false,
      error: {
        message: 'Invalid query parameters',
        code: 'INVALID_QUERY_PARAMS',
        details: errors,
      },
    };
  }

  return { success: true, data: result.data };
}

const releasesQuerySchema = z.object({
  key: z.string().optional(),
  slug: z.string().optional(),
  youtubeId: z.string().optional(),
  status: z.string().optional(),
  format: z.string().optional(),
  type: z.string().optional(),
  duration: z.string().optional(),
  year: z.string().optional(),
  search: z.string().optional(),
  refresh: z.string().optional(),
  nocache: z.string().optional(),
});

const searchParams = new URLSearchParams('status=published');
const res = validateQueryParams(searchParams, releasesQuerySchema);
console.log(JSON.stringify(res, null, 2));

const searchParams2 = new URLSearchParams('status=published&unknown=val');
const res2 = validateQueryParams(searchParams2, releasesQuerySchema);
console.log(JSON.stringify(res2, null, 2));
