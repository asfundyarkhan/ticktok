import { ActivityService } from "../services/activityService";

// Example function to demonstrate activity logging
async function demonstrateActivity() {
  try {
    // Create an activity for a stock purchase
    const activityId = await ActivityService.createActivity({
      userId: "example-user-123",
      userDisplayName: "John Doe",
      type: "stock_purchased",
      details: {
        quantity: 5,
        productName: "Premium T-Shirt",
      },
      status: "completed",
    });

    console.log(`Activity created with ID: ${activityId}`);

    // Subscribe to real-time activity updates
    const unsubscribe = ActivityService.subscribeToActivities(
      (activities) => {
        console.log("\nCurrent activities:");
        activities.forEach((activity) => {
          const message = ActivityService.formatActivityMessage(activity);
          console.log(message);
        });
      },
      (error) => {
        console.error("Error in activity subscription:", error);
      },
      5 // limit to 5 most recent activities
    );

    // Keep the subscription active for 10 seconds
    setTimeout(() => {
      unsubscribe();
      console.log("\nUnsubscribed from activity updates");
    }, 10000);
  } catch (error) {
    console.error("Error in activity demonstration:", error);
  }
}

// Run the demonstration
demonstrateActivity().then(() => {
  console.log("Activity demonstration started...");
});
