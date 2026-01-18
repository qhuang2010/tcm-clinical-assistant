import 'package:flutter_test/flutter_test.dart';
import 'package:zhongyi_medic/models/patient.dart';

void main() {
  group('Patient Model Tests', () {
    test('Patient should serialize and deserialize correctly', () {
      // Arrange
      final patient = Patient(
        id: 1,
        name: '张三',
        gender: '男',
        age: 30,
        phone: '13800138000',
        pinyin: 'zs',
        lastVisit: DateTime(2024, 1, 15),
      );

      // Act
      final json = patient.toJson();
      final fromJson = Patient.fromJson(json);

      // Assert
      expect(fromJson.id, patient.id);
      expect(fromJson.name, patient.name);
      expect(fromJson.gender, patient.gender);
      expect(fromJson.age, patient.age);
      expect(fromJson.phone, patient.phone);
      expect(fromJson.pinyin, patient.pinyin);
      expect(fromJson.lastVisit, patient.lastVisit);
    });

    test('MedicalRecord should serialize and deserialize correctly', () {
      // Arrange
      final record = MedicalRecord(
        id: 1,
        patientInfo: {
          'name': '张三',
          'gender': '男',
          'age': 30,
        },
        medicalRecord: {
          'complaint': '头痛',
        },
        pulseGrid: {
          'left-cun-fu': '浮',
        },
      );

      // Act
      final json = record.toJson();
      final fromJson = MedicalRecord.fromJson(json);

      // Assert
      expect(fromJson.id, record.id);
      expect(fromJson.patientInfo['name'], record.patientInfo['name']);
      expect(fromJson.medicalRecord['complaint'], record.medicalRecord['complaint']);
      expect(fromJson.pulseGrid['left-cun-fu'], record.pulseGrid['left-cun-fu']);
    });

    test('Practitioner should serialize and deserialize correctly', () {
      // Arrange
      final practitioner = Practitioner(
        id: 1,
        name: '主治医师',
        role: 'doctor',
      );

      // Act
      final json = practitioner.toJson();
      final fromJson = Practitioner.fromJson(json);

      // Assert
      expect(fromJson.id, practitioner.id);
      expect(fromJson.name, practitioner.name);
      expect(fromJson.role, practitioner.role);
    });

    test('AnalysisResult should serialize and deserialize correctly', () {
      // Arrange
      final result = AnalysisResult(
        consistencyComment: '脉象一致',
        prescriptionComment: '处方正确',
        suggestion: '建议休息',
      );

      // Act
      final json = result.toJson();
      final fromJson = AnalysisResult.fromJson(json);

      // Assert
      expect(fromJson.consistencyComment, result.consistencyComment);
      expect(fromJson.prescriptionComment, result.prescriptionComment);
      expect(fromJson.suggestion, result.suggestion);
    });
  });
}
