import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const cardFields = z.object({
	/** 所属分类，与目录名一致，例如 agent、deep-learning */
	category: z.string().optional(),
	tags: z.array(z.string()).default([]),
	/** 掌握状态，后续复习队列可以基于它筛选 */
	status: z.enum(['new', 'learning', 'review', 'mastered']).default('new'),
	difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
	/** 面试频率，复习时按它加权 */
	frequency: z.enum(['high', 'medium', 'low']).optional(),
	last_reviewed: z.coerce.date().optional(),
	/** 面经、论文或博客来源 */
	source: z.string().optional(),
});

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({ extend: cardFields }),
	}),
};
