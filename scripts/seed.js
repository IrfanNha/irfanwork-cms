// scripts/seed-advanced.js
"use strict";

const strapi = require("@strapi/strapi");
const faker = require("faker");

async function seed() {
	await strapi().load();

	console.log("🟢 Starting seeding...");

	// ======================
	// 1. Categories
	// ======================
	const categoriesData = [
		{ name: "Tech", slug: "tech", description: "Technology articles" },
		{
			name: "Lifestyle",
			slug: "lifestyle",
			description: "Lifestyle posts",
		},
		{
			name: "Tutorial",
			slug: "tutorial",
			description: "Tutorials and guides",
		},
	];

	for (const cat of categoriesData) {
		const exists = await strapi.db
			.query("api::category.category")
			.findOne({ where: { slug: cat.slug } });
		if (!exists) {
			await strapi.db
				.query("api::category.category")
				.create({ data: cat });
		}
	}

	const allCategories = await strapi.db
		.query("api::category.category")
		.findMany();

	// ======================
	// 2. Tags
	// ======================
	const tagsData = [
		"JavaScript",
		"Next.js",
		"Productivity",
		"React",
		"Node.js",
	];

	for (const t of tagsData) {
		const exists = await strapi.db
			.query("api::tag.tag")
			.findOne({ where: { slug: t.toLowerCase() } });
		if (!exists) {
			await strapi.db
				.query("api::tag.tag")
				.create({ data: { name: t, slug: t.toLowerCase() } });
		}
	}

	const allTags = await strapi.db.query("api::tag.tag").findMany();

	// ======================
	// 3. Users
	// ======================
	const users = [
		{
			username: "admin",
			email: "admin@example.com",
			password: "password123",
			role: 1, // Super Admin
			confirmed: true,
		},
	];

	for (const user of users) {
		const exists = await strapi.db
			.query("plugin::users-permissions.user")
			.findOne({ where: { email: user.email } });
		if (!exists) {
			await strapi.db
				.query("plugin::users-permissions.user")
				.create({ data: user });
		}
	}

	// ======================
	// 4. Posts
	// ======================
	const NUM_POSTS = 20;
	const posts = [];

	for (let i = 0; i < NUM_POSTS; i++) {
		const title = faker.lorem.sentence();
		const slug = faker.helpers.slugify(title.toLowerCase());
		const content = faker.lorem.paragraphs(3);
		const excerpt = faker.lorem.sentences(2);

		// Random categories & tags
		const categories = faker.helpers.arrayElements(
			allCategories.map((c) => c.id),
			faker.datatype.number({ min: 1, max: 2 })
		);
		const tags = faker.helpers.arrayElements(
			allTags.map((t) => t.id),
			faker.datatype.number({ min: 1, max: 3 })
		);

		posts.push({ title, slug, content, excerpt, categories, tags });
	}

	// Create posts first
	const createdPosts = [];
	for (const post of posts) {
		const exists = await strapi.db
			.query("api::post.post")
			.findOne({ where: { slug: post.slug } });
		if (!exists) {
			const created = await strapi.db
				.query("api::post.post")
				.create({ data: post });
			createdPosts.push(created);
		}
	}

	// ======================
	// 5. Related Posts
	// ======================
	for (const post of createdPosts) {
		const related = faker.helpers.arrayElements(
			createdPosts.filter((p) => p.id !== post.id).map((p) => p.id),
			faker.datatype.number({ min: 1, max: 3 })
		);
		await strapi.db.query("api::post.post").update({
			where: { id: post.id },
			data: { relatedPosts: related },
		});
	}

	console.log(
		`✅ Seeded ${NUM_POSTS} posts with categories, tags, and related posts!`
	);
}

seed().catch((err) => {
	console.error(err);
});
