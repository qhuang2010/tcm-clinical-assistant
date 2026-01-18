import 'package:json_annotation/json_annotation.dart';

part 'patient.g.dart';

@JsonSerializable()
class Patient {
  final int? id;
  final String name;
  final String gender;
  final int age;
  final String? phone;
  final String? pinyin;
  final DateTime? lastVisit;
  final Map<String, dynamic>? info;

  Patient({
    this.id,
    required this.name,
    required this.gender,
    required this.age,
    this.phone,
    this.pinyin,
    this.lastVisit,
    this.info,
  });

  factory Patient.fromJson(Map<String, dynamic> json) =>
      _$PatientFromJson(json);

  Map<String, dynamic> toJson() => _$PatientToJson(this);
}

@JsonSerializable()
class MedicalRecord {
  final int? id;
  final int? recordId;
  final Map<String, dynamic> patientInfo;
  final Map<String, dynamic> medicalRecord;
  final Map<String, dynamic> pulseGrid;

  MedicalRecord({
    this.id,
    this.recordId,
    required this.patientInfo,
    required this.medicalRecord,
    required this.pulseGrid,
  });

  factory MedicalRecord.fromJson(Map<String, dynamic> json) =>
      _$MedicalRecordFromJson(json);

  Map<String, dynamic> toJson() => _$MedicalRecordToJson(this);
}

@JsonSerializable()
class Practitioner {
  final int id;
  final String name;
  final String role;

  Practitioner({
    required this.id,
    required this.name,
    required this.role,
  });

  factory Practitioner.fromJson(Map<String, dynamic> json) =>
      _$PractitionerFromJson(json);

  Map<String, dynamic> toJson() => _$PractitionerToJson(this);
}

@JsonSerializable()
class AnalysisResult {
  final String consistencyComment;
  final String prescriptionComment;
  final String suggestion;

  AnalysisResult({
    required this.consistencyComment,
    required this.prescriptionComment,
    required this.suggestion,
  });

  factory AnalysisResult.fromJson(Map<String, dynamic> json) =>
      _$AnalysisResultFromJson(json);

  Map<String, dynamic> toJson() => _$AnalysisResultToJson(this);
}
