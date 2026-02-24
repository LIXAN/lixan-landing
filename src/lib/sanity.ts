import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url';

// ─────────────────────────────────────────────────────────────
// Client initialisation
// ─────────────────────────────────────────────────────────────
// Use || (not ??) so empty-string values also fall through to the hardcoded default.
// import.meta.env is NOT used here because it is unreliable at module-load time
// during Vercel's SSR pre-rendering phase; process.env is always populated.
export const sanityClient = createClient({
  projectId:  process.env.SANITY_PROJECT_ID  || 'dbxx60js',
  dataset:   (process.env.SANITY_DATASET     || 'production').trim() || 'production',
  apiVersion: '2024-01-01',
  token:      process.env.SANITY_API_TOKEN   || undefined,
  useCdn:     process.env.NODE_ENV === 'production',
});

// ─────────────────────────────────────────────────────────────
// Image URL helper
// ─────────────────────────────────────────────────────────────
const builder = createImageUrlBuilder(sanityClient);

/**
 * Returns a Sanity image URL builder instance.
 * Usage: urlFor(image).width(800).url()
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// ─────────────────────────────────────────────────────────────
// Type definitions (minimal, extend as needed)
// ─────────────────────────────────────────────────────────────
export interface SanityPost {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt: string;
  coverImage: SanityImageSource & { alt: string };
  author: string;
  publishedAt: string;
  content: unknown[]; // Portable Text blocks
}

export interface SanityCaseStudy {
  _id: string;
  title: string;
  slug: { current: string };
  client: string;
  industry: string;
  challenge: string;
  solution: string;
  results: string[];
  services: string[];
  coverImage: SanityImageSource & { alt: string };
  images: Array<SanityImageSource & { alt: string; caption?: string }>;
  featured: boolean;
  publishedAt: string;
}

export interface SanityService {
  _id: string;
  name: string;
  slug: { current: string };
  shortDescription: string;
  fullDescription: string;
  icon: string;
  features: string[];
  order: number;
  highlighted: boolean;
}

export interface SanityTestimonial {
  _id: string;
  authorName: string;
  role: string;
  company: string;
  quote: string;
  avatar?: SanityImageSource & { alt?: string };
  rating: number;
  featured: boolean;
  order: number;
}

export interface SanitySiteConfig {
  _id: string;
  siteName: string;
  tagline: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  ogImage?: SanityImageSource;
}

export interface SanityProcessStep {
  _key: string;
  number: string;
  icon: string;
  title: string;
  description: string;
}

export interface SanityHomePage {
  _id: string;
  heroHeadline: string;
  heroAccent: string;
  heroSubtitle: string;
  heroCta1: string;
  heroCta2?: string;
  processSteps: SanityProcessStep[];
}

export interface SanityFaq {
  _id: string;
  question: string;
  answer: string;
  order: number;
}

// ─────────────────────────────────────────────────────────────
// GROQ queries
// ─────────────────────────────────────────────────────────────

/** Fetch all published blog posts, newest first. */
export async function getAllPosts(): Promise<SanityPost[]> {
  return sanityClient.fetch<SanityPost[]>(
    `*[_type == "post"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      excerpt,
      coverImage { ..., alt },
      author,
      publishedAt
    }`
  );
}

/** Fetch a single blog post by slug, including full content. */
export async function getPostBySlug(slug: string): Promise<SanityPost | null> {
  return sanityClient.fetch<SanityPost | null>(
    `*[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      excerpt,
      coverImage { ..., alt },
      author,
      publishedAt,
      content
    }`,
    { slug }
  );
}

/** Fetch all case studies, newest first. */
export async function getAllCaseStudies(): Promise<SanityCaseStudy[]> {
  return sanityClient.fetch<SanityCaseStudy[]>(
    `*[_type == "caseStudy"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      client,
      industry,
      results,
      coverImage { ..., alt },
      featured,
      publishedAt
    }`
  );
}

/** Fetch a single case study by slug, including all fields. */
export async function getCaseStudyBySlug(slug: string): Promise<SanityCaseStudy | null> {
  return sanityClient.fetch<SanityCaseStudy | null>(
    `*[_type == "caseStudy" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      client,
      industry,
      challenge,
      solution,
      results,
      services,
      coverImage { ..., alt },
      images[] { ..., alt, caption },
      featured,
      publishedAt
    }`,
    { slug }
  );
}

/** Fetch all services ordered by the 'order' field. */
export async function getAllServices(): Promise<SanityService[]> {
  return sanityClient.fetch<SanityService[]>(
    `*[_type == "service"] | order(order asc) {
      _id,
      name,
      slug,
      shortDescription,
      fullDescription,
      icon,
      features,
      order,
      highlighted
    }`
  );
}

/** Fetch all featured testimonials for the homepage. */
export async function getAllTestimonials(featuredOnly = false): Promise<SanityTestimonial[]> {
  const filter = featuredOnly
    ? `*[_type == "testimonial" && featured == true]`
    : `*[_type == "testimonial"]`;

  return sanityClient.fetch<SanityTestimonial[]>(
    `${filter} | order(order asc) {
      _id,
      authorName,
      role,
      company,
      quote,
      avatar { ..., alt },
      rating,
      featured,
      order
    }`
  );
}

/** Fetch the singleton site configuration document. */
export async function getSiteConfig(): Promise<SanitySiteConfig | null> {
  return sanityClient.fetch<SanitySiteConfig | null>(
    `*[_type == "siteConfig" && _id == "siteConfig"][0] {
      _id,
      siteName,
      tagline,
      email,
      phone,
      whatsapp,
      linkedin,
      instagram,
      twitter,
      ogImage
    }`
  );
}

/** Fetch the singleton home page content (Hero + HowItWorks). */
export async function getHomePage(): Promise<SanityHomePage | null> {
  return sanityClient.fetch<SanityHomePage | null>(
    `*[_type == "homePage" && _id == "homePage"][0] {
      _id,
      heroHeadline,
      heroAccent,
      heroSubtitle,
      heroCta1,
      heroCta2,
      processSteps[] {
        _key,
        number,
        icon,
        title,
        description
      }
    }`
  );
}

/** Fetch all FAQ items ordered by the 'order' field. */
export async function getAllFaqs(): Promise<SanityFaq[]> {
  return sanityClient.fetch<SanityFaq[]>(
    `*[_type == "faq"] | order(order asc) {
      _id,
      question,
      answer,
      order
    }`
  );
}
