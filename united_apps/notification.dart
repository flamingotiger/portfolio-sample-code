import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:get/get.dart';
import 'package:timezone/timezone.dart' as tz;

class LocalNotification {
  LocalNotification._();

  static FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  static init() async {
    // 알림 설정 초기화
    AndroidInitializationSettings initializationSettingsAndroid =
        const AndroidInitializationSettings('mipmap/ic_launcher'); // 앱 아이콘 설정

    DarwinInitializationSettings initializationSettingsIOS =
        const DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    InitializationSettings initializationSettings = InitializationSettings(
        android: initializationSettingsAndroid, iOS: initializationSettingsIOS);

    await flutterLocalNotificationsPlugin.initialize(initializationSettings,
        onDidReceiveNotificationResponse: (response) {
      if (response.id == 0) {
        Get.offNamed('/');
      } else if (response.id == 1) {
        Get.offNamed('/world');
      }
    });
  }

  static requestNotificationPermission() {
    flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
            IOSFlutterLocalNotificationsPlugin>()
        ?.requestPermissions(
          alert: true,
          badge: true,
          sound: true,
        );
  }

  static void scheduleNotification(
      {required int id,
      required String title,
      required String body,
      tz.TZDateTime? scheduledTime}) async {
    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
      'channelId',
      'channelName',
      channelDescription: 'channelDescription',
      importance: Importance.max,
      priority: Priority.high,
      showWhen: false,
      playSound: false,
    );

    const DarwinNotificationDetails iosDetails =
        DarwinNotificationDetails(badgeNumber: 0, sound: null);

    var platformChannelSpecifics =
        const NotificationDetails(android: androidDetails, iOS: iosDetails);

    if (scheduledTime == null) return;

    await flutterLocalNotificationsPlugin.zonedSchedule(
      id,
      title,
      body,
      scheduledTime,
      platformChannelSpecifics,
      androidAllowWhileIdle: true,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
    );
  }

  static Future<void> showNotification(
      {required int id,
      required String title,
      required String body,
      String? payload,
      DateTime? scheduledTime}) async {
    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
      'channelId',
      'channelName',
      channelDescription: 'channelDescription',
      importance: Importance.max,
      priority: Priority.high,
      showWhen: false,
      playSound: false,
    );

    const DarwinNotificationDetails iosDetails =
        DarwinNotificationDetails(badgeNumber: 0, sound: null);

    NotificationDetails generalNotificationDetails =
        const NotificationDetails(android: androidDetails, iOS: iosDetails);

    await flutterLocalNotificationsPlugin.show(
      id,
      title,
      body,
      generalNotificationDetails,
      payload: payload,
    );
  }

  // 0: local notification, 1: world notification
  static void cancelNotifications(int id) {
    flutterLocalNotificationsPlugin.cancel(id);
  }
}
