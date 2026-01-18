import 'package:flutter_test/flutter_test.dart';
import 'package:zhongyi_medic/main.dart';
import 'package:flutter/material.dart';

void main() {
  testWidgets('App starts without error', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const ZhongyiMedicApp());

    // Verify that app title is found
    expect(find.text('中医脉象九宫格'), findsOneWidget);
  });

  testWidgets('App has 3 bottom navigation items', (WidgetTester tester) async {
    await tester.pumpWidget(const ZhongyiMedicApp());

    // Find navigation destinations
    expect(find.text('患者'), findsOneWidget);
    expect(find.text('脉象'), findsOneWidget);
    expect(find.text('设置'), findsOneWidget);
  });
}
