/**
 * Seed Staff Data
 *
 * This script seeds the staff table with initial data for testing.
 */

import { db } from "@/lib/db";
import { staff } from "@/lib/db/schema/staff-schema";
import { user } from "@/lib/db/schema/auth-schema";
import { nanoid } from "nanoid";

const seedStaff = async () => {
  try {
    console.log("Starting staff seed...");

    // Get existing users to create staff records for
    const existingUsers = await db.select().from(user).limit(5);
    
    if (existingUsers.length === 0) {
      console.log("No users found. Please create some users first.");
      return;
    }

    // Check if staff already exists
    const existingStaff = await db.select().from(staff);
    if (existingStaff.length > 0) {
      console.log("Staff table already has data. Skipping seed.");
      return;
    }

    // Create staff records for existing users
    const staffData = [
      {
        id: nanoid(),
        userId: existingUsers[0]?.id || nanoid(),
        role: "admin" as const,
        status: "active" as const,
        avatar: null,
      },
      {
        id: nanoid(),
        userId: existingUsers[1]?.id || nanoid(),
        role: "manager" as const,
        status: "active" as const,
        avatar: null,
      },
      {
        id: nanoid(),
        userId: existingUsers[2]?.id || nanoid(),
        role: "staff" as const,
        status: "active" as const,
        avatar: null,
      },
    ];

    // Filter out any entries where userId is undefined
    const validStaffData = staffData.filter(s => s.userId !== nanoid()); // Filter out entries with fallback nanoid

    if (validStaffData.length > 0) {
      await db.insert(staff).values(validStaffData);
      console.log(`Successfully seeded ${validStaffData.length} staff records`);
    } else {
      console.log("No valid users found to create staff records");
    }

    console.log("Staff seed completed successfully");
  } catch (error) {
    console.error("Error seeding staff:", error);
    process.exit(1);
  }
};

// Run the seed function
seedStaff().then(() => {
  console.log("Staff seeding process finished");
  process.exit(0);
});
