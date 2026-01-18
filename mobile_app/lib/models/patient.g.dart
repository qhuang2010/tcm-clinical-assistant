// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'patient.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Patient _$PatientFromJson(Map<String, dynamic> json) => Patient(
      id: (json['id'] as num?)?.toInt(),
      name: json['name'] as String,
      gender: json['gender'] as String,
      age: (json['age'] as num).toInt(),
      phone: json['phone'] as String?,
      pinyin: json['pinyin'] as String?,
      lastVisit: json['lastVisit'] == null
          ? null
          : DateTime.parse(json['lastVisit'] as String),
      info: json['info'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$PatientToJson(Patient instance) => <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'gender': instance.gender,
      'age': instance.age,
      'phone': instance.phone,
      'pinyin': instance.pinyin,
      'lastVisit': instance.lastVisit?.toIso8601String(),
      'info': instance.info,
    };

MedicalRecord _$MedicalRecordFromJson(Map<String, dynamic> json) =>
    MedicalRecord(
      id: (json['id'] as num?)?.toInt(),
      recordId: (json['recordId'] as num?)?.toInt(),
      patientInfo: json['patientInfo'] as Map<String, dynamic>,
      medicalRecord: json['medicalRecord'] as Map<String, dynamic>,
      pulseGrid: json['pulseGrid'] as Map<String, dynamic>,
    );

Map<String, dynamic> _$MedicalRecordToJson(MedicalRecord instance) =>
    <String, dynamic>{
      'id': instance.id,
      'recordId': instance.recordId,
      'patientInfo': instance.patientInfo,
      'medicalRecord': instance.medicalRecord,
      'pulseGrid': instance.pulseGrid,
    };

Practitioner _$PractitionerFromJson(Map<String, dynamic> json) => Practitioner(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      role: json['role'] as String,
    );

Map<String, dynamic> _$PractitionerToJson(Practitioner instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'role': instance.role,
    };

AnalysisResult _$AnalysisResultFromJson(Map<String, dynamic> json) =>
    AnalysisResult(
      consistencyComment: json['consistencyComment'] as String,
      prescriptionComment: json['prescriptionComment'] as String,
      suggestion: json['suggestion'] as String,
    );

Map<String, dynamic> _$AnalysisResultToJson(AnalysisResult instance) =>
    <String, dynamic>{
      'consistencyComment': instance.consistencyComment,
      'prescriptionComment': instance.prescriptionComment,
      'suggestion': instance.suggestion,
    };
