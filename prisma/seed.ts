import { PrismaClient } from "../lib/generated/prisma"; // Điều chỉnh đường dẫn nếu cần
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding ...");

  // --- Seed Settings ---
  let settings = await prisma.setting.findFirst();
  if (settings) {
    settings = await prisma.setting.update({
      where: { id: settings.id },
      data: {
        theme: "dark",
        siteTitle: "PORTFOLIO",
        showPortrait: true,
        resumeUrl: "/resume.pdf",
        globalFontFamily: "font-sans",
      },
    });
  } else {
    settings = await prisma.setting.create({
      data: {
        theme: "dark",
        siteTitle: "PORTFOLIO",
        showPortrait: true,
        resumeUrl: "/resume.pdf",
        globalFontFamily: "font-sans",
      },
    });
  }
  console.log("Upserted settings:", settings);

  // --- Seed Admin User ---
  const adminEmail = "ntthau0963@gmail.com";
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    const hashedPassword = await bcrypt.hash("Ntth@0963", 10);
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin User",
        password: hashedPassword,
        isAdmin: true,
      },
    });
    console.log(`Created admin user with id: ${adminUser.id}`);
  } else {
    console.log(`Admin user ${adminEmail} already exists.`);
  }

  // --- Seed Main Sections ---
  const sectionSlugs = [
    "hero",
    "introduction",
    "projects",
    "education",
    "skills",
    "experience",
    "testimonials",
    "contact",
    "custom-example",
  ];
  const sectionData = [
    { slug: "hero", title: "PORTFOLIO", type: "hero", order: 0, visible: true },
    {
      slug: "introduction",
      title: "INTRODUCTION",
      type: "introduction",
      order: 1,
      visible: true,
    },
    {
      slug: "projects",
      title: "PROJECTS",
      type: "projects",
      order: 2,
      visible: true,
    },
    {
      slug: "education",
      title: "EDUCATION",
      type: "education",
      order: 3,
      visible: true,
    },
    {
      slug: "skills",
      title: "SKILLS",
      type: "skills",
      order: 4,
      visible: true,
    },
    {
      slug: "experience",
      title: "EXPERIENCE",
      type: "experience",
      order: 5,
      visible: true,
    },
    {
      slug: "testimonials",
      title: "TESTIMONIALS",
      type: "testimonials",
      order: 6,
      visible: true,
    },
    {
      slug: "contact",
      title: "CONTACT",
      type: "contact",
      order: 7,
      visible: true,
    },
    {
      slug: "custom-example",
      title: "MY CUSTOM SECTION",
      type: "custom",
      order: 8,
      visible: true,
    },
  ];

  const sections: { [key: string]: { id: string } } = {};
  for (const data of sectionData) {
    const section = await prisma.section.upsert({
      where: { slug: data.slug },
      update: {
        title: data.title,
        type: data.type,
        order: data.order,
        visible: data.visible,
      },
      create: data,
    });
    sections[data.slug] = { id: section.id };
    console.log(`Upserted section: ${section.slug}`);
  }

  // --- Seed Categories for Projects ---
  const categoryNames = [
    "Web Development",
    "Mobile App",
    "UI/UX Design",
    "Branding",
    "Print",
  ];
  const categories: { [key: string]: { id: string } } = {};
  for (const name of categoryNames) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, order: Object.keys(categories).length },
    });
    categories[name] = { id: category.id };
    console.log(`Upserted category: ${category.name}`);
  }

  // --- Seed Hero Section Content ---
  if (sections.hero) {
    await prisma.heroSectionContent.upsert({
      where: { sectionId: sections.hero.id },
      update: { portraitImageSrc: "/placeholder-portrait.jpg" },
      create: {
        sectionId: sections.hero.id,
        portraitImageSrc: "/placeholder-portrait.jpg",
        portraitAlt: "My Portrait",
      },
    });
    // Cleanup existing text blocks for Hero section
    await prisma.textBlock.deleteMany({
      where: { sectionId: sections.hero.id },
    });
    await prisma.textBlock.createMany({
      data: [
        {
          sectionId: sections.hero.id,
          content: "Welcome to My Portfolio. I build amazing things.",
          order: 0,
          fontSize: 16,
          fontFamily: "font-sans",
        },
        {
          sectionId: sections.hero.id,
          content: "You can see anything about me in this way.",
          order: 1,
          fontSize: 14,
          fontFamily: "font-sans",
        },
      ],
    });
    console.log("Seeded Hero Section Content (with TextBlock cleanup)");
  }

  // --- Seed Introduction Section Content (Example with TextBlock) ---
  if (sections.introduction) {
    await prisma.textBlock.deleteMany({
      where: {
        sectionId: sections.introduction.id,
      },
    });
    await prisma.textBlock.createMany({
      data: [
        {
          sectionId: sections.introduction.id,
          content: "This is the introduction to my work and passion.",
          order: 0,
          fontSize: 16,
          fontFamily: "font-sans",
        },
        {
          sectionId: sections.introduction.id,
          content:
            "I focus on creating intuitive and engaging digital experiences.",
          order: 1,
          fontSize: 14,
          fontFamily: "font-sans",
        },
      ],
    });
    // Delete existing image blocks for Introduction section before creating new ones
    await prisma.imageBlock.deleteMany({
      where: { sectionId: sections.introduction.id },
    });
    await prisma.imageBlock.create({
      data: {
        sectionId: sections.introduction.id,
        src: "https://picsum.photos/400/300?random=intro",
        alt: "Intro Image",
        order: 0,
      },
    });
    console.log(
      "Seeded Introduction Section Content (with TextBlock & ImageBlock cleanup)"
    );
  }

  // --- Seed Projects Section TextBlocks ---
  if (sections.projects) {
    await prisma.textBlock.deleteMany({
      where: { sectionId: sections.projects.id },
    });
    await prisma.textBlock.createMany({
      data: [
        {
          sectionId: sections.projects.id,
          content: "A selection of my featured works.",
          order: 0,
          fontSize: 18,
          fontFamily: "font-serif",
        },
      ],
    });
    console.log("Seeded TextBlocks for Projects Section");
  }

  // --- Seed Education Section TextBlocks ---
  if (sections.education) {
    await prisma.textBlock.deleteMany({
      where: { sectionId: sections.education.id },
    });
    await prisma.textBlock.createMany({
      data: [
        {
          sectionId: sections.education.id,
          content: "My academic journey and qualifications.",
          order: 0,
          fontSize: 18,
          fontFamily: "font-serif",
        },
      ],
    });
    console.log("Seeded TextBlocks for Education Section");

    const educationData = [
      {
        institution: "Creative University",
        degree: "Master of Fine Arts",
        period: "2020 - 2022",
        description: "Focused on interactive design and digital media.",
        order: 0,
        images: [
          {
            src: "https://picsum.photos/600/400?random=edu_creative",
            alt: "Campus View",
            order: 0,
          },
        ],
      },
      {
        institution: "RIMBERIO UNIVERSITY",
        degree: "Bachelor's degree in Design",
        period: "2019-2020",
        description:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet.",
        order: 1,
        images: [
          {
            src: "https://picsum.photos/600/400?random=edu1",
            alt: "Rimberio Image 1",
            order: 0,
          },
          {
            src: "https://picsum.photos/600/400?random=edu2",
            alt: "Rimberio Image 2",
            order: 1,
          },
        ],
      },
      {
        institution: "LAKANA UNIVERSITY",
        degree: "Master's degree in Creative Arts",
        period: "2020-2021",
        description:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet.",
        order: 2,
        images: [
          {
            src: "https://picsum.photos/600/400?random=edu3",
            alt: "Lakana Image 1",
            order: 0,
          },
        ],
      },
      {
        institution: "RIMBERIO UNIVERSITY",
        degree: "Advanced studies in Digital Design",
        period: "2021-2022",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        order: 3,
        images: [],
      },
      {
        institution: "WARIDERE UNIVERSITY",
        degree: "PhD in Visual Communication",
        period: "2022-2023",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        order: 4,
        images: [
          {
            src: "https://picsum.photos/600/400?random=edu4",
            alt: "Waridere Image 1",
            order: 0,
          },
        ],
      },
    ];

    // Delete existing items for this section first to avoid duplicates if re-seeding
    await prisma.educationItem.deleteMany({
      where: { sectionId: sections.education.id },
    });

    // Create items one by one to handle nested image creation
    for (const itemData of educationData) {
      const createdItem = await prisma.educationItem.create({
        data: {
          sectionId: sections.education.id,
          institution: itemData.institution,
          degree: itemData.degree,
          period: itemData.period,
          description: itemData.description,
          order: itemData.order,
          images: {
            create: itemData.images,
          },
        },
      });
      console.log("Seeded Education Item:", createdItem.institution);
    }
  }

  // --- Seed Skill Items & Skill Images ---
  if (sections.skills) {
    // Cleanup and Seed TextBlocks for Skills section subtitle
    await prisma.textBlock.deleteMany({
      where: { sectionId: sections.skills.id },
    });
    await prisma.textBlock.createMany({
      data: [
        {
          sectionId: sections.skills.id,
          content: "A showcase of my technical and creative abilities.",
          order: 0,
          fontSize: 18,
          fontFamily: "font-serif",
        },
      ],
    });
    console.log("Seeded TextBlocks for Skills Section");

    // Cleanup existing skill items and images before seeding
    await prisma.skillItem.deleteMany({
      where: { sectionId: sections.skills.id },
    });
    await prisma.skillImage.deleteMany({
      where: { sectionId: sections.skills.id },
    });

    await prisma.skillItem.createMany({
      data: [
        {
          sectionId: sections.skills.id,
          title: "JavaScript",
          description: "Expert in modern JS, ES6+, Node.js",
          level: 90,
          order: 0,
        },
        {
          sectionId: sections.skills.id,
          title: "React & Next.js",
          description: "Building performant web applications.",
          level: 85,
          order: 1,
        },
      ],
    });
    await prisma.skillImage.createMany({
      data: [
        {
          sectionId: sections.skills.id,
          src: "https://picsum.photos/400/300?random=skill_img1",
          alt: "Skill context 1",
          order: 0,
        },
        {
          sectionId: sections.skills.id,
          src: "https://picsum.photos/400/300?random=skill_img2",
          alt: "Skill context 2",
          order: 1,
        },
      ],
    });
    console.log("Seeded Skill Items and Images");
  }

  // --- Seed Experience Items ---
  if (sections.experience) {
    // Cleanup and Seed TextBlocks for Experience section subtitle
    await prisma.textBlock.deleteMany({
      where: { sectionId: sections.experience.id },
    });
    await prisma.textBlock.createMany({
      data: [
        {
          sectionId: sections.experience.id,
          content: "My professional journey and key roles.",
          order: 0,
          fontSize: 18,
          fontFamily: "font-serif",
        },
      ],
    });
    console.log("Seeded TextBlocks for Experience Section");

    // Cleanup existing experience items before seeding
    await prisma.experienceItem.deleteMany({
      where: { sectionId: sections.experience.id },
    });
    // Note: If ExperienceItem has nested relations like detailImages that need cleanup,
    // you might need to delete them individually or ensure onDelete: Cascade is effective.
    // For now, assuming deleteMany on ExperienceItem is sufficient or cascade works.

    await prisma.experienceItem.create({
      data: {
        sectionId: sections.experience.id,
        positionTitle: "Lead Developer",
        companyName: "Tech Solutions Inc.",
        period: "2022 - Present",
        summary: "Leading a team to build innovative web platforms.",
        description: "Full description of responsibilities and achievements.",
        imageSrc: "https://picsum.photos/300/200?random=exp1",
        order: 0,
        detailImages: {
          create: [{ src: "https://picsum.photos/600/400?random=exp_detail1" }],
        },
      },
    });
    console.log("Seeded Experience Item");
  }

  // --- Seed Project Items ---
  if (
    sections.projects &&
    categories["Web Development"] &&
    categories["UI/UX Design"]
  ) {
    // Cleanup existing project items before seeding

    const existingProjectsInSection = await prisma.projectItem.findMany({
      where: { sectionId: sections.projects.id },
      select: { id: true, categoryIds: true },
    });

    // For each project being deleted, remove its ID from the categories it belongs to
    for (const project of existingProjectsInSection) {
      for (const categoryId of project.categoryIds) {
        // Fetch the category
        const category = await prisma.category.findUnique({
          where: { id: categoryId },
          select: { projectIds: true },
        });
        if (category) {
          // Filter out the current project's ID
          const updatedProjectIds = category.projectIds.filter(
            (pid) => pid !== project.id
          );
          // Update the category with the new list of projectIds
          await prisma.category.update({
            where: { id: categoryId },
            data: { projectIds: updatedProjectIds },
          });
        }
      }
    }

    // Now, it's safe to delete the project items for the section
    await prisma.projectItem.deleteMany({
      where: { sectionId: sections.projects.id },
    });

    // Seed new Project Item
    const newProject = await prisma.projectItem.create({
      data: {
        sectionId: sections.projects.id,
        title: "E-commerce Platform Redesign",
        companyName: "Client X",
        description1: "Complete overhaul of an online retail platform.",
        imageSrc: "https://picsum.photos/400/300?random=proj1",
        order: 0,
        // Link to categories by their IDs
        categoryIds: [
          categories["Web Development"].id,
          categories["UI/UX Design"].id,
        ],
      },
    });
    // After creating the new project, we need to add its ID back to the respective categories
    if (newProject) {
      for (const categoryId of newProject.categoryIds) {
        await prisma.category.update({
          where: { id: categoryId },
          data: {
            projectIds: {
              push: newProject.id, // Add the new project's ID
            },
          },
        });
      }
    }

    console.log("Seeded Project Item and updated Category relations");
  }

  // --- Seed Testimonial Items ---
  if (sections.testimonials) {
    // Cleanup and Seed TextBlocks for Testimonials section subtitle
    await prisma.textBlock.deleteMany({
      where: { sectionId: sections.testimonials.id },
    });
    await prisma.textBlock.createMany({
      data: [
        {
          sectionId: sections.testimonials.id,
          content:
            "Hear what our clients have to say about their experience working with us. We take pride in delivering exceptional results and building lasting relationships.",
          order: 0,
          fontSize: 16,
          fontFamily: "font-sans",
        },
      ],
    });
    console.log("Seeded TextBlocks for Testimonials Section");

    // Cleanup existing testimonial items
    await prisma.testimonialItem.deleteMany({
      where: { sectionId: sections.testimonials.id },
    });

    await prisma.testimonialItem.create({
      data: {
        sectionId: sections.testimonials.id,
        clientName: "Jane Doe",
        role: "CEO",
        company: "Acme Corp",
        content: "This portfolio is amazing! Highly recommend.",
        rating: 5,
        imageSrc: "https://picsum.photos/200/200?random=client1",
        order: 0,
      },
    });
    console.log("Seeded Testimonial Item");
  }

  // --- Seed Contact Info Items & ImageBlocks ---
  if (sections.contact) {
    // Cleanup and Seed TextBlocks for Contact section paragraphs
    await prisma.textBlock.deleteMany({
      where: { sectionId: sections.contact.id },
    });
    await prisma.textBlock.createMany({
      data: [
        {
          sectionId: sections.contact.id,
          content:
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi egestas mollis sem nec consectetur. Etiam pellentesque turpis lorem, nec dapibus libero viverra vel. Nulla facilisi.",
          order: 0,
          fontSize: 14,
          fontFamily: "font-sans",
        },
        {
          sectionId: sections.contact.id,
          content:
            "Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique.",
          order: 1,
          fontSize: 14,
          fontFamily: "font-sans",
        },
      ],
    });
    console.log("Seeded TextBlocks for Contact Section");

    // Cleanup existing contact info items
    await prisma.contactInfoItem.deleteMany({
      where: { sectionId: sections.contact.id },
    });

    await prisma.contactInfoItem.createMany({
      data: [
        {
          sectionId: sections.contact.id,
          type: "email",
          value: "hello@myportfolio.com",
          label: "Primary Email",
          order: 0,
        },
        {
          sectionId: sections.contact.id,
          type: "phone",
          value: "+123-456-7890",
          order: 1,
        },
        {
          sectionId: sections.contact.id,
          type: "linkedin",
          value: "linkedin.com/in/myportfolio",
          order: 2,
        },
      ],
    });
    console.log("Seeded Contact Info Items");

    // Cleanup and Seed ImageBlocks for Contact section
    await prisma.imageBlock.deleteMany({
      where: { sectionId: sections.contact.id },
    });
    await prisma.imageBlock.createMany({
      data: [
        {
          sectionId: sections.contact.id,
          src: "https://picsum.photos/600/400?random=contact1",
          alt: "Contact Image 1",
          order: 0,
        },
        {
          sectionId: sections.contact.id,
          src: "https://picsum.photos/600/400?random=contact2",
          alt: "Contact Image 2",
          order: 1,
        },
      ],
    });
    console.log("Seeded ImageBlocks for Contact Section");
  }

  // --- Seed Custom Section Example ---
  if (sections["custom-example"]) {
    // Cleanup existing custom section content blocks
    await prisma.customSectionContentBlock.deleteMany({
      where: { sectionId: sections["custom-example"].id },
    });

    await prisma.customSectionContentBlock.createMany({
      data: [
        {
          sectionId: sections["custom-example"].id,
          type: "HEADING_H1",
          content: "Welcome to my Custom Area",
          order: 0,
        },
        {
          sectionId: sections["custom-example"].id,
          type: "PARAGRAPH",
          content:
            "This section is fully customizable with various content blocks.",
          order: 1,
        },
        {
          sectionId: sections["custom-example"].id,
          type: "IMAGE",
          imageSrc: "https://picsum.photos/800/400?random=custom",
          imageAlt: "Custom Section Image",
          order: 2,
        },
      ],
    });
    console.log("Seeded Custom Section Example Content");
  }

  console.log("Seeding finished.");
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
