#!/usr/bin/env python3
"""
代码验证和准备脚本
在没有Flutter环境的情况下验证Dart代码语法
"""

import os
import re
import json
from pathlib import Path

def check_dart_syntax(filepath):
    """简单的Dart语法检查"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # 检查基本语法
        errors = []

        # 检查import语句
        imports = re.findall(r"^import\s+[^;]+;", content, re.MULTILINE)
        for imp in imports:
            if imp.count("'") + imp.count('"') != 2:
                errors.append(f"Import语句格式错误: {imp}")

        # 检查class定义
        classes = re.findall(r"^class\s+\w+\s*{", content, re.MULTILINE)
        for cls in classes:
            if not re.search(r"^\s+class", cls):
                errors.append(f"Class定义可能缩进错误")

        return len(errors) == 0, errors

    except Exception as e:
        return False, [f"读取文件错误: {str(e)}"]

def check_json_serializable(filepath):
    """检查@JsonSerializable注解是否正确使用"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # 查找@JsonSerializable
        has_annotation = '@JsonSerializable()' in content

        if has_annotation:
            # 检查part 'xxx.g.dart'
            has_part = re.search(r"part\s+'[^']+';", content)
            if not has_part:
                return False, ["缺少part 'xxx.g.dart'语句"]
            else:
                return True, []

        return True, []

    except Exception as e:
        return False, [f"检查失败: {str(e)}"]

def validate_file_structure():
    """验证项目文件结构"""
    required_files = {
        'lib/main.dart': '应用入口',
        'lib/models/patient.dart': '数据模型',
        'lib/services/api_service.dart': 'API服务',
        'lib/screens/home_screen.dart': '主页',
        'lib/screens/patient_list_screen.dart': '患者列表',
        'lib/screens/patient_detail_screen.dart': '患者详情',
        'lib/screens/pulse_input_screen.dart': '脉象录入',
        'lib/screens/settings_screen.dart': '设置',
        'pubspec.yaml': '依赖配置',
    }

    print("\n" + "="*60)
    print("检查项目文件结构")
    print("="*60)

    missing = []
    for filepath, description in required_files.items():
        if os.path.exists(filepath):
            print(f"✓ {description:20s} -> {filepath}")
        else:
            print(f"✗ {description:20s} -> {filepath} (缺失)")
            missing.append(filepath)

    if missing:
        print(f"\n⚠️  缺少 {len(missing)} 个文件")
        return False
    else:
        print(f"\n✅ 所有必需文件都存在")
        return True

def generate_model_class():
    """生成模型类的示例代码"""
    code = '''// GENERATED CODE - patient.g.dart
// 这是自动生成的代码示例

part of 'patient.dart';

Patient _$PatientFromJson(Map<String, dynamic> json) {
  return Patient(
    id: json['id'] as int?,
    name: json['name'] as String,
    gender: json['gender'] as String,
    age: json['age'] as int,
    phone: json['phone'] as String?,
    pinyin: json['pinyin'] as String?,
    lastVisit: json['last_visit'] != null
        ? DateTime.parse(json['last_visit'])
        : null,
    info: json['info'] as Map<String, dynamic>?,
  );
}

Map<String, dynamic> _$PatientToJson(Patient instance) {
  return <String, dynamic>{
    'id': instance.id,
    'name': instance.name,
    'gender': instance.gender,
    'age': instance.age,
    'phone': instance.phone,
    'pinyin': instance.pinyin,
    'last_visit': instance.lastVisit?.toIso8601String(),
    'info': instance.info,
  };
}

MedicalRecord _$MedicalRecordFromJson(Map<String, dynamic> json) {
  return MedicalRecord(
    id: json['id'] as int?,
    recordId: json['record_id'] as int?,
    patientInfo: json['patient_info'] as Map<String, dynamic>,
    medicalRecord: json['medical_record'] as Map<String, dynamic>,
    pulseGrid: json['pulse_grid'] as Map<String, dynamic>,
  );
}

Map<String, dynamic> _$MedicalRecordToJson(MedicalRecord instance) {
  return <String, dynamic>{
    'id': instance.id,
    'record_id': instance.recordId,
    'patient_info': instance.patientInfo,
    'medical_record': instance.medicalRecord,
    'pulse_grid': instance.pulseGrid,
  };
}

Practitioner _$PractitionerFromJson(Map<String, dynamic> json) {
  return Practitioner(
    id: json['id'] as int,
    name: json['name'] as String,
    role: json['role'] as String,
  );
}

Map<String, dynamic> _$PractitionerToJson(Practitioner instance) {
  return <String, dynamic>{
    'id': instance.id,
    'name': instance.name,
    'role': instance.role,
  };
}

AnalysisResult _$AnalysisResultFromJson(Map<String, dynamic> json) {
  return AnalysisResult(
    consistencyComment: json['consistency_comment'] as String,
    prescriptionComment: json['prescription_comment'] as String,
    suggestion: json['suggestion'] as String,
  );
}

Map<String, dynamic> _$AnalysisResultToJson(AnalysisResult instance) {
  return <String, dynamic>{
    'consistency_comment': instance.consistencyComment,
    'prescription_comment': instance.prescriptionComment,
    'suggestion': instance.suggestion,
  };
}
'''

    with open('lib/models/patient.g.dart', 'w', encoding='utf-8') as f:
        f.write(code)

    print("\n✅ 已生成 lib/models/patient.g.dart")
    return True

def main():
    print("\n" + "="*60)
    print("中医脉象九宫格OCR识别系统 - 代码验证脚本")
    print("="*60)

    # 检查文件结构
    structure_ok = validate_file_structure()

    if not structure_ok:
        print("\n⚠️  请先补充缺失的文件")
        return

    # 检查Dart代码
    print("\n" + "="*60)
    print("检查Dart代码语法")
    print("="*60)

    dart_files = [
        'lib/main.dart',
        'lib/models/patient.dart',
        'lib/services/api_service.dart',
        'lib/screens/home_screen.dart',
        'lib/screens/pulse_input_screen.dart',
    ]

    all_valid = True
    for filepath in dart_files:
        if os.path.exists(filepath):
            is_valid, errors = check_dart_syntax(filepath)
            if is_valid:
                print(f"✓ {filepath}")
            else:
                print(f"✗ {filepath}")
                for error in errors:
                    print(f"  - {error}")
                all_valid = False

    # 检查JSON序列化配置
    print("\n" + "="*60)
    print("检查JSON序列化配置")
    print("="*60)

    model_file = 'lib/models/patient.dart'
    if os.path.exists(model_file):
        is_valid, errors = check_json_serializable(model_file)
        if is_valid:
            print(f"✓ {model_file} - JSON序列化配置正确")
        else:
            print(f"⚠️  {model_file}")
            for error in errors:
                print(f"  - {error}")

    # 生成.g.dart文件
    print("\n" + "="*60)
    print("生成.g.dart文件")
    print("="*60)

    try:
        generate_model_class()
    except Exception as e:
        print(f"⚠️  生成失败: {str(e)}")

    # 总结
    print("\n" + "="*60)
    print("验证完成")
    print("="*60)

    if all_valid:
        print("\n✅ 代码验证通过！")
        print("\n下一步:")
        print("1. 安装Flutter: brew install --cask flutter")
        print("2. 进入项目: cd mobile_app")
        print("3. 安装依赖: flutter pub get")
        print("4. 运行应用: flutter run")
    else:
        print("\n⚠️  发现代码问题，请修复后重试")

if __name__ == '__main__':
    main()
