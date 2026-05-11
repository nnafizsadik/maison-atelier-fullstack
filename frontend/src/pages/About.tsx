import { Layout } from "@/components/Layout";

const About = () => (
  <Layout>
    <section className="container max-w-3xl py-20">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">Our story</p>
      <h1 className="mt-4 font-display text-5xl leading-tight md:text-6xl">
        We started with one question: <span className="italic">why does so little last?</span>
      </h1>
      <div className="prose prose-neutral mt-10 max-w-none text-base leading-relaxed text-muted-foreground">
        <p>
          Maison Atelier began in 2021 as a notebook of ateliers we'd visited —
          a weaver in Porto, a leatherworker outside Florence, a ceramicist in
          rural Hokkaidō. People making the same thing, beautifully, for decades.
        </p>
        <p>
          Today we work with eleven of them. Each piece in the catalog has a
          person behind it, a process we've watched, and a price we can defend
          line by line. We publish cost-of-goods on every product page.
        </p>
        <p>
          We won't ever be a thousand SKUs. We don't run sales. And we'll repair
          anything we made, free, for as long as you own it.
        </p>
      </div>
    </section>
  </Layout>
);

export default About;
