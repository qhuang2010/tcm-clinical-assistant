import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/patient_provider.dart';
import '../models/patient.dart';
import 'pulse_input_screen.dart';

class PatientDetailScreen extends StatefulWidget {
  final Patient? patient;

  const PatientDetailScreen({
    super.key,
    this.patient,
  });

  @override
  State<PatientDetailScreen> createState() => _PatientDetailScreenState();
}

class _PatientDetailScreenState extends State<PatientDetailScreen> {
  final _nameController = TextEditingController();
  final _genderController = TextEditingController();
  final _ageController = TextEditingController();
  final _phoneController = TextEditingController();
  final _complaintController = TextEditingController();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.patient != null) {
      _nameController.text = widget.patient!.name;
      _genderController.text = widget.patient!.gender;
      _ageController.text = widget.patient!.age.toString();
      _phoneController.text = widget.patient!.phone ?? '';
      _loadPatientRecord();
    }
  }

  Future<void> _loadPatientRecord() async {
    if (widget.patient == null) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final apiService = context.read<ApiService>();
      final record = await apiService.getPatientLatestRecord(widget.patient!.id!);
      _complaintController.text = record['medical_record']['complaint'] ?? '';
      context.read<PatientProvider>().updatePulseGrid(record['pulse_grid']);
    } catch (e) {
      debugPrint('Error loading patient record: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _saveRecord() async {
    if (_nameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请输入患者姓名')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final apiService = context.read<ApiService>();
      final patientProvider = context.read<PatientProvider>();

      final data = {
        'patient_info': {
          'name': _nameController.text,
          'gender': _genderController.text,
          'age': int.tryParse(_ageController.text) ?? 0,
          'phone': _phoneController.text,
        },
        'medical_record': {
          'complaint': _complaintController.text,
        },
        'pulse_grid': patientProvider.pulseGrid ?? {},
        'mode': 'personal',
      };

      await apiService.saveRecord(data);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('保存成功')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('保存失败: $e')),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _goToPulseInput() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PulseInputScreen(
          patient: widget.patient,
          complaint: _complaintController.text,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.patient == null ? '新建病历' : '患者详情'),
        actions: [
          if (widget.patient != null)
            TextButton.icon(
              onPressed: _isLoading ? null : _saveRecord,
              icon: const Icon(Icons.save),
              label: const Text('保存'),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '患者信息',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: '姓名',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _genderController,
                          decoration: const InputDecoration(
                            labelText: '性别',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: _ageController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: '年龄',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: '电话',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    '主诉',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _complaintController,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      labelText: '请输入主诉',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 24),
                  if (widget.patient != null) ...[
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _goToPulseInput,
                        icon: const Icon(Icons.grid_on),
                        label: const Text('录入脉象'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          textStyle: const TextStyle(fontSize: 16),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: _isLoading ? null : _saveRecord,
                        icon: const Icon(Icons.save),
                        label: const Text('保存病历'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          textStyle: const TextStyle(fontSize: 16),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }
}
