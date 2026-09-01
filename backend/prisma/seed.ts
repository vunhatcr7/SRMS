/// <reference types="node" />
import { PrismaClient, ProcessStage, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const defaultPassword = 'Password123@';

async function cleanupDatabase() {
  await prisma.interview.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.recruiterProfile.deleteMany({});
  await prisma.candidateProfile.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.user.deleteMany({});
}

async function main() {
  console.log('Starting SRMS seed...');

  await cleanupDatabase();
  console.log('Old seed data removed.');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@srms.com',
      passwordHash,
      role: UserRole.ADMIN,
      fullName: 'SRMS Admin',
      phone: '0900000001',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@srms.com',
      passwordHash,
      role: UserRole.MANAGER,
      fullName: 'Nguyen Thi Manager',
      phone: '0900000002',
    },
  });

  const recruiter = await prisma.user.create({
    data: {
      email: 'recruiter@fpt.com',
      passwordHash,
      role: UserRole.RECRUITER,
      fullName: 'Tran Van Recruiter',
      phone: '0900000003',
    },
  });

  const interviewer = await prisma.user.create({
    data: {
      email: 'interviewer1@srms.com',
      passwordHash,
      role: UserRole.INTERVIEWER,
      fullName: 'Le Van Interviewer',
      phone: '0900000004',
    },
  });

  const candidate = await prisma.user.create({
    data: {
      email: 'nguyenvana@gmail.com',
      passwordHash,
      role: UserRole.CANDIDATE,
      fullName: 'Nguyen Van A',
      phone: '0900000005',
    },
  });

  const company = await prisma.company.create({
    data: {
      name: 'FPT Software',
      website: 'https://fptsoftware.com',
      logo: 'https://example.com/fpt-logo.png',
      description: 'Demo company for SRMS recruitment workflow.',
    },
  });

  await prisma.recruiterProfile.create({
    data: {
      userId: recruiter.id,
      companyId: company.id,
    },
  });

  const candidateProfile = await prisma.candidateProfile.create({
    data: {
      userId: candidate.id,
      skills: ['React', 'TypeScript', 'Node.js', 'REST API'],
      experience: {
        years: 2,
        position: 'Frontend Developer',
        summary: 'Built React dashboards and integrated REST APIs.',
      },
      education: {
        school: 'Demo University',
        major: 'Software Engineering',
        degree: 'Bachelor',
      },
      resumeUrl: 'https://example.com/resume-nguyen-van-a.pdf',
    },
  });

  const job = await prisma.job.create({
    data: {
      companyId: company.id,
      recruiterId: recruiter.id,
      title: 'Frontend Developer',
      description: 'Build responsive web interfaces for the SRMS platform.',
      requirements: 'React, TypeScript, Node.js, REST API, teamwork',
      salaryRange: '15M - 25M',
      benefits: 'Bảo hiểm đầy đủ, lương tháng 13, hybrid 2 ngày/tuần, đào tạo nội bộ.',
      location: 'Ho Chi Minh City',
      isActive: true,
    },
  });

  const application = await prisma.application.create({
    data: {
      jobId: job.id,
      candidateId: candidateProfile.id,
      stage: ProcessStage.INTERVIEW,
      matchingScore: 82,
      skillScore: 88,
      experienceScore: 75,
      aiExplanation:
        'Candidate has strong overlap with React, TypeScript, Node.js and REST API requirements. Experience is suitable for an MVP frontend role.',
    },
  });

  await prisma.interview.create({
    data: {
      applicationId: application.id,
      scheduledAt: new Date('2026-07-15T09:00:00.000Z'),
      locationOrLink: 'https://meet.google.com/srms-demo',
      interviewerName: interviewer.fullName ?? 'Le Van Interviewer',
    },
  });

  console.log('Seed completed successfully.');
  console.log('');
  console.log('Login accounts:');
  console.log(`- Admin: ${admin.email}`);
  console.log(`- Manager: ${manager.email}`);
  console.log(`- Recruiter: ${recruiter.email}`);
  console.log(`- Interviewer: ${interviewer.email}`);
  console.log(`- Candidate: ${candidate.email}`);
  console.log(`Password for all accounts: ${defaultPassword}`);
  console.log('');
  console.log('Demo data created:');
  console.log(`- Company: ${company.name}`);
  console.log(`- Job: ${job.title}`);
  console.log(`- Candidate profile: ${candidate.fullName}`);
  console.log(`- Application stage: ${application.stage}`);
  console.log(`- Matching score: ${application.matchingScore}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
