import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	// Definimos qué datos tiene cada post en la cabecera
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		heroImage: z.string().optional(),
		category: z.string().optional(),
	}),
});

export const collections = { blog };