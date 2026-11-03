import { reminderDate } from "../domain/time";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { AppData } from "./store";
import { iso, occurrences, parseDate } from "../domain/finance";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
export async function requestNotifications() {
  if (Platform.OS === "web")
    throw new Error(
      "Local reminders require iOS or Android. Web preview does not schedule notifications.",
    );
  const result = await Notifications.requestPermissionsAsync();
  if (result.status !== "granted")
    throw new Error(
      "Permission was declined. Enable notifications in device settings to retry.",
    );
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("payments", {
      name: "Student reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
}
let queue: Promise<void> = Promise.resolve();
export function reschedule(data: AppData) {
  queue = queue.catch(() => {}).then(() => schedule(data));
  return queue;
}
async function schedule(data: AppData) {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!data.settings.notifications) return;
  const now = new Date(),
    end = new Date(now);
  end.setDate(end.getDate() + 60);
  const items = occurrences(data.expenses, iso(now), iso(end)).filter(
    (o) => !o.paid && o.expense.reminder,
  );
  for (const o of items.slice(0, 40)) {
    const date = reminderDate(
      o.date,
      data.settings.reminderDays,
      data.settings.timezone,
    );
    if (date > now)
      await Notifications.scheduleNotificationAsync({
        identifier: o.key,
        content: {
          title: `Upcoming: ${o.expense.name}`,
          body: "Open your payment plan to review this expense.",
          data: { url: "/calendar", date: o.date, expenseId: o.expense.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
        },
      });
  }
  for (const [id, saved] of Object.entries(data.saved).slice(0, 15)) {
    if (!saved.reminderDate) continue;
    try {
      const date = reminderDate(saved.reminderDate, 0, data.settings.timezone);
      if (date > now)
        await Notifications.scheduleNotificationAsync({
          identifier: `opportunity:${id}`,
          content: {
            title: "Check your saved opportunity",
            body: "Review your application and official deadline.",
            data: { url: "/discover", opportunityId: id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date,
          },
        });
    } catch {
      /* Partially typed dates are not scheduled. */
    }
  }
}
