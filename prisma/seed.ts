import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Starting database seed...");

  // =========================================================
  // 1. ADMIN USER
  // =========================================================

  const passwordHash = await bcrypt.hash("biruke", 12);

  const admin = await prisma.user.upsert({
    where: {
      email: "biruksew2@gmail.com",
    },
    update: {
      name: "Busticketing Administrator",
      phone: "0925020907",
      passwordHash,
      role: "ADMIN",
    },
    create: {
      name: "Busticketing Administrator",
      email: "biruksew2@gmail.com",
      phone: "0925020907",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`✅ Admin: ${admin.email}`);

  // =========================================================
  // 2. BUSES
  // =========================================================

  const bus1 = await prisma.bus.upsert({
    where: {
      plateNumber: "3-A12345",
    },
    update: {
      name: "Selam Bus",
      seatCount: 49,
      status: "ACTIVE",
    },
    create: {
      name: "Selam Bus",
      plateNumber: "3-A12345",
      seatCount: 49,
      status: "ACTIVE",
    },
  });

  const bus2 = await prisma.bus.upsert({
    where: {
      plateNumber: "4-B23456",
    },
    update: {
      name: "Sky Bus",
      seatCount: 45,
      status: "ACTIVE",
    },
    create: {
      name: "Sky Bus",
      plateNumber: "4-B23456",
      seatCount: 45,
      status: "ACTIVE",
    },
  });

  const bus3 = await prisma.bus.upsert({
    where: {
      plateNumber: "5-C34567",
    },
    update: {
      name: "Habesha Express",
      seatCount: 49,
      status: "ACTIVE",
    },
    create: {
      name: "Habesha Express",
      plateNumber: "5-C34567",
      seatCount: 49,
      status: "ACTIVE",
    },
  });

  const bus4 = await prisma.bus.upsert({
    where: {
      plateNumber: "6-D45678",
    },
    update: {
      name: "Golden Bus",
      seatCount: 49,
      status: "ACTIVE",
    },
    create: {
      name: "Golden Bus",
      plateNumber: "6-D45678",
      seatCount: 49,
      status: "ACTIVE",
    },
  });

  const bus5 = await prisma.bus.upsert({
    where: {
      plateNumber: "7-E56789",
    },
    update: {
      name: "Zemen Bus",
      seatCount: 45,
      status: "ACTIVE",
    },
    create: {
      name: "Zemen Bus",
      plateNumber: "7-E56789",
      seatCount: 45,
      status: "ACTIVE",
    },
  });

  const bus6 = await prisma.bus.upsert({
    where: {
      plateNumber: "8-F67890",
    },
    update: {
      name: "Bishoftu Bus",
      seatCount: 49,
      status: "ACTIVE",
    },
    create: {
      name: "Bishoftu Bus",
      plateNumber: "8-F67890",
      seatCount: 49,
      status: "ACTIVE",
    },
  });

  const bus7 = await prisma.bus.upsert({
    where: {
      plateNumber: "9-G78901",
    },
    update: {
      name: "Abay Bus",
      seatCount: 45,
      status: "ACTIVE",
    },
    create: {
      name: "Abay Bus",
      plateNumber: "9-G78901",
      seatCount: 45,
      status: "ACTIVE",
    },
  });

  console.log("✅ Buses created");

  // =========================================================
  // 3. ROUTES
  // =========================================================

  async function getOrCreateRoute(
    origin: string,
    destination: string,
    distanceKm: number,
    durationMin: number
  ) {
    const existing = await prisma.route.findFirst({
      where: {
        origin,
        destination,
      },
    });

    if (existing) {
      return existing;
    }

    return prisma.route.create({
      data: {
        origin,
        destination,
        distanceKm,
        durationMin,
      },
    });
  }

  const addisBahirDar = await getOrCreateRoute(
    "Addis Ababa",
    "Bahir Dar",
    565,
    540
  );

  const addisGondar = await getOrCreateRoute(
    "Addis Ababa",
    "Gondar",
    725,
    600
  );

  const addisDessie = await getOrCreateRoute(
    "Addis Ababa",
    "Dessie",
    400,
    360
  );

  const bahirDarGondar = await getOrCreateRoute(
    "Bahir Dar",
    "Gondar",
    180,
    240
  );

  const addisHawassa = await getOrCreateRoute(
    "Addis Ababa",
    "Hawassa",
    275,
    240
  );

  const addisJimma = await getOrCreateRoute(
    "Addis Ababa",
    "Jimma",
    350,
    300
  );

  const addisAdama = await getOrCreateRoute(
    "Addis Ababa",
    "Adama",
    100,
    120
  );

  console.log("✅ Routes created");

  // =========================================================
  // 4. SCHEDULE HELPER
  // =========================================================

  async function getOrCreateSchedule(
    busId: string,
    routeId: string,
    departureTime: Date,
    arrivalTime: Date,
    price: number
  ) {
    const existing = await prisma.schedule.findFirst({
      where: {
        busId,
        routeId,
        departureTime,
      },
    });

    if (existing) {
      return existing;
    }

    return prisma.schedule.create({
      data: {
        busId,
        routeId,
        departureTime,
        arrivalTime,
        price,
      },
    });
  }

  // =========================================================
  // 5. TOMORROW
  // =========================================================

  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  // =========================================================
  // 6. SCHEDULE 1
  // Selam Bus
  // Addis Ababa → Bahir Dar
  // =========================================================

  const schedule1Departure = new Date(tomorrow);
  schedule1Departure.setHours(6, 0, 0, 0);

  const schedule1Arrival = new Date(schedule1Departure);
  schedule1Arrival.setMinutes(
    schedule1Arrival.getMinutes() + 540
  );

  const schedule1 = await getOrCreateSchedule(
    bus1.id,
    addisBahirDar.id,
    schedule1Departure,
    schedule1Arrival,
    850
  );

  // =========================================================
  // 7. SCHEDULE 2
  // Sky Bus
  // Addis Ababa → Gondar
  // =========================================================

  const schedule2Departure = new Date(tomorrow);
  schedule2Departure.setHours(7, 0, 0, 0);

  const schedule2Arrival = new Date(schedule2Departure);
  schedule2Arrival.setMinutes(
    schedule2Arrival.getMinutes() + 600
  );

  const schedule2 = await getOrCreateSchedule(
    bus2.id,
    addisGondar.id,
    schedule2Departure,
    schedule2Arrival,
    1050
  );

  // =========================================================
  // 8. SCHEDULE 3
  // Habesha Express
  // Addis Ababa → Dessie
  // =========================================================

  const schedule3Departure = new Date(tomorrow);
  schedule3Departure.setHours(6, 30, 0, 0);

  const schedule3Arrival = new Date(schedule3Departure);
  schedule3Arrival.setMinutes(
    schedule3Arrival.getMinutes() + 360
  );

  const schedule3 = await getOrCreateSchedule(
    bus3.id,
    addisDessie.id,
    schedule3Departure,
    schedule3Arrival,
    650
  );

  // =========================================================
  // 9. SCHEDULE 4
  // Selam Bus
  // Bahir Dar → Gondar
  // =========================================================

  const schedule4Departure = new Date(tomorrow);
  schedule4Departure.setHours(8, 0, 0, 0);

  const schedule4Arrival = new Date(schedule4Departure);
  schedule4Arrival.setMinutes(
    schedule4Arrival.getMinutes() + 240
  );

  const schedule4 = await getOrCreateSchedule(
    bus1.id,
    bahirDarGondar.id,
    schedule4Departure,
    schedule4Arrival,
    400
  );

  // =========================================================
  // 10. SCHEDULE 5
  // Golden Bus
  // Addis Ababa → Bahir Dar
  // =========================================================

  const schedule5Departure = new Date(tomorrow);
  schedule5Departure.setHours(7, 30, 0, 0);

  const schedule5Arrival = new Date(schedule5Departure);
  schedule5Arrival.setMinutes(
    schedule5Arrival.getMinutes() + 540
  );

  const schedule5 = await getOrCreateSchedule(
    bus4.id,
    addisBahirDar.id,
    schedule5Departure,
    schedule5Arrival,
    900
  );

  // =========================================================
  // 11. SCHEDULE 6
  // Zemen Bus
  // Addis Ababa → Gondar
  // =========================================================

  const schedule6Departure = new Date(tomorrow);
  schedule6Departure.setHours(8, 30, 0, 0);

  const schedule6Arrival = new Date(schedule6Departure);
  schedule6Arrival.setMinutes(
    schedule6Arrival.getMinutes() + 600
  );

  const schedule6 = await getOrCreateSchedule(
    bus5.id,
    addisGondar.id,
    schedule6Departure,
    schedule6Arrival,
    1100
  );

  // =========================================================
  // 12. SCHEDULE 7
  // Bishoftu Bus
  // Addis Ababa → Dessie
  // =========================================================

  const schedule7Departure = new Date(tomorrow);
  schedule7Departure.setHours(9, 0, 0, 0);

  const schedule7Arrival = new Date(schedule7Departure);
  schedule7Arrival.setMinutes(
    schedule7Arrival.getMinutes() + 360
  );

  const schedule7 = await getOrCreateSchedule(
    bus6.id,
    addisDessie.id,
    schedule7Departure,
    schedule7Arrival,
    700
  );

  // =========================================================
  // 13. SCHEDULE 8
  // Abay Bus
  // Bahir Dar → Gondar
  // =========================================================

  const schedule8Departure = new Date(tomorrow);
  schedule8Departure.setHours(10, 0, 0, 0);

  const schedule8Arrival = new Date(schedule8Departure);
  schedule8Arrival.setMinutes(
    schedule8Arrival.getMinutes() + 240
  );

  const schedule8 = await getOrCreateSchedule(
    bus7.id,
    bahirDarGondar.id,
    schedule8Departure,
    schedule8Arrival,
    450
  );

  // =========================================================
  // 14. SCHEDULE 9
  // Golden Bus
  // Addis Ababa → Hawassa
  // =========================================================

  const schedule9Departure = new Date(tomorrow);
  schedule9Departure.setHours(9, 30, 0, 0);

  const schedule9Arrival = new Date(schedule9Departure);
  schedule9Arrival.setMinutes(
    schedule9Arrival.getMinutes() + 240
  );

  const schedule9 = await getOrCreateSchedule(
    bus4.id,
    addisHawassa.id,
    schedule9Departure,
    schedule9Arrival,
    500
  );

  // =========================================================
  // 15. SCHEDULE 10
  // Zemen Bus
  // Addis Ababa → Jimma
  // =========================================================

  const schedule10Departure = new Date(tomorrow);
  schedule10Departure.setHours(7, 0, 0, 0);

  const schedule10Arrival = new Date(schedule10Departure);
  schedule10Arrival.setMinutes(
    schedule10Arrival.getMinutes() + 300
  );

  const schedule10 = await getOrCreateSchedule(
    bus5.id,
    addisJimma.id,
    schedule10Departure,
    schedule10Arrival,
    600
  );

  // =========================================================
  // 16. SCHEDULE 11
  // Bishoftu Bus
  // Addis Ababa → Adama
  // =========================================================

  const schedule11Departure = new Date(tomorrow);
  schedule11Departure.setHours(8, 0, 0, 0);

  const schedule11Arrival = new Date(schedule11Departure);
  schedule11Arrival.setMinutes(
    schedule11Arrival.getMinutes() + 120
  );

  const schedule11 = await getOrCreateSchedule(
    bus6.id,
    addisAdama.id,
    schedule11Departure,
    schedule11Arrival,
    250
  );

  // =========================================================
  // 17. SCHEDULES CREATED
  // =========================================================

  console.log("✅ Schedules created");

  // =========================================================
  // 18. CREATE SEATS
  // =========================================================

  const schedules = [
    {
      schedule: schedule1,
      seatCount: bus1.seatCount,
    },
    {
      schedule: schedule2,
      seatCount: bus2.seatCount,
    },
    {
      schedule: schedule3,
      seatCount: bus3.seatCount,
    },
    {
      schedule: schedule4,
      seatCount: bus1.seatCount,
    },
    {
      schedule: schedule5,
      seatCount: bus4.seatCount,
    },
    {
      schedule: schedule6,
      seatCount: bus5.seatCount,
    },
    {
      schedule: schedule7,
      seatCount: bus6.seatCount,
    },
    {
      schedule: schedule8,
      seatCount: bus7.seatCount,
    },
    {
      schedule: schedule9,
      seatCount: bus4.seatCount,
    },
    {
      schedule: schedule10,
      seatCount: bus5.seatCount,
    },
    {
      schedule: schedule11,
      seatCount: bus6.seatCount,
    },
  ];

  // =========================================================
  // 19. CREATE AVAILABLE SEATS
  // =========================================================

  for (const item of schedules) {
    const seats = [];

    for (let i = 1; i <= item.seatCount; i++) {
      seats.push({
        scheduleId: item.schedule.id,
        seatNumber: String(i),
        status: "AVAILABLE" as const,
      });
    }

    await prisma.seat.createMany({
      data: seats,
      skipDuplicates: true,
    });
  }

  console.log("✅ Seats created");

  // =========================================================
  // COMPLETE
  // =========================================================

  console.log("");
  console.log("========================================");
  console.log("🌱 DATABASE SEED COMPLETED SUCCESSFULLY");
  console.log("========================================");
  console.log("");
  console.log("Admin email: biruksew2@gmail.com");
  console.log("Admin password: biruke");
  console.log("");
  console.log("Buses: 7");
  console.log("Routes: 7");
  console.log("Schedules: 11");
  console.log("Seats: created automatically");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });