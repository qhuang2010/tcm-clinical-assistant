import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../services/api_service.dart';
import '../services/patient_provider.dart';
import '../models/patient.dart';
import '../utils/common_utils.dart';
import '../widgets/common_widgets.dart';

class PulseInputScreen extends StatefulWidget {
  final Patient? patient;
  final String? complaint;

  const PulseInputScreen({
    super.key,
    this.patient,
    this.complaint,
  });

  @override
  State<PulseInputScreen> createState() => _PulseInputScreenState();
}

class _PulseInputScreenState extends State<PulseInputScreen> {
  final Map<String, TextEditingController> _controllers = {};
  bool _isLoading = false;
  AnalysisResult? _analysisResult;
  final List<String> _pulseTypes = [
    '浮', '沉', '迟', '数', '滑', '涩', '弦', '紧', '缓', '弱', '虚', '实', '长', '短', '大', '小'
  ];
  String _overallDescription = '';
  String _prescription = '';

  @override
  void initState() {
    super.initState();
    _initializeGrid();
  }

  void _initializeGrid() {
    final positions = ['cun', 'guan', 'chi'];
    final levels = ['fu', 'zhong', 'chen'];
    final hands = ['left', 'right'];

    for (var hand in hands) {
      for (var pos in positions) {
        for (var level in levels) {
          final key = '$hand-$pos-$level';
          _controllers[key] = TextEditingController();
        }
      }
    }

    // 加载已保存的脉象数据
    final savedGrid = context.read<PatientProvider>().pulseGrid;
    if (savedGrid != null) {
      savedGrid.forEach((key, value) {
        if (_controllers.containsKey(key)) {
          _controllers[key]!.text = value.toString();
        }
      });
      _overallDescription = savedGrid['overall_description'] ?? '';
    }
  }

  void _showPulsePicker(String key, TextEditingController controller) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('选择脉象'),
        content: SizedBox(
          width: double.maxFinite,
          child: GridView.builder(
            shrinkWrap: true,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 5,
              childAspectRatio: 1.5,
            ),
            itemCount: _pulseTypes.length,
            itemBuilder: (context, index) {
              final pulse = _pulseTypes[index];
              return Card(
                child: InkWell(
                  onTap: () {
                    controller.text = pulse;
                    Navigator.pop(context);
                  },
                  child: Center(
                    child: Text(
                      pulse,
                      style: const TextStyle(fontSize: 18),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Map<String, dynamic> _getPulseGrid() {
    final grid = <String, dynamic>{};
    _controllers.forEach((key, controller) {
      if (controller.text.isNotEmpty) {
        grid[key] = controller.text;
      }
    });
    if (_overallDescription.isNotEmpty) {
      grid['overall_description'] = _overallDescription;
    }
    return grid;
  }

  Future<void> _analyzeRecord() async {
    setState(() {
      _isLoading = true;
      _analysisResult = null;
    });

    try {
      final apiService = context.read<ApiService>();
      final pulseGrid = _getPulseGrid();

      final result = await apiService.analyzeRecord({
        'medical_record': {
          'complaint': widget.complaint ?? '',
          'prescription': _prescription,
        },
        'pulse_grid': pulseGrid,
      });

      setState(() {
        _analysisResult = result;
      });
    } catch (e) {
      SnackBarUtils.showError(context, '分析失败: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _saveRecord() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final apiService = context.read<ApiService>();
      final pulseGrid = _getPulseGrid();

      final data = {
        'patient_info': widget.patient != null
            ? {
                'name': widget.patient!.name,
                'gender': widget.patient!.gender,
                'age': widget.patient!.age,
                'phone': widget.patient!.phone,
              }
            : {
                'name': '患者${const Uuid().v4().substring(0, 8)}',
                'gender': '未知',
                'age': 0,
              },
        'medical_record': {
          'complaint': widget.complaint ?? '',
          'prescription': _prescription,
        },
        'pulse_grid': pulseGrid,
        'mode': 'personal',
      };

      await apiService.saveRecord(data);

      context.read<PatientProvider>().updatePulseGrid(pulseGrid);

      if (mounted) {
        SnackBarUtils.showSuccess(context, '保存成功');
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        SnackBarUtils.showError(context, '保存失败: $e');
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('脉象九宫格录入'),
        actions: [
          IconButton(
            icon: const Icon(Icons.analytics),
            onPressed: _isLoading ? null : _analyzeRecord,
            tooltip: '分析',
          ),
          IconButton(
            icon: const Icon(Icons.save),
            onPressed: _isLoading ? null : _saveRecord,
            tooltip: '保存',
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
                  _buildHandSection('左手', 'left'),
                  const SizedBox(height: 24),
                  _buildHandSection('右手', 'right'),
                  const SizedBox(height: 24),
                  TextField(
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: '整体脉象描述',
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (value) {
                      _overallDescription = value;
                    },
                    controller: TextEditingController(text: _overallDescription),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: '处方',
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (value) {
                      _prescription = value;
                    },
                    controller: TextEditingController(text: _prescription),
                  ),
                  if (_analysisResult != null) ...[
                    const SizedBox(height: 24),
                    LabeledDivider(label: '分析结果'),
                    const SizedBox(height: 16),
                    Card(
                      color: Colors.teal[50],
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _analysisResult!.consistencyComment,
                              style: const TextStyle(fontSize: 14),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              '处方建议：${_analysisResult!.prescriptionComment}',
                              style: const TextStyle(fontSize: 14),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              '建议：${_analysisResult!.suggestion}',
                              style: const TextStyle(fontSize: 14),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }

  Widget _buildHandSection(String title, String hand) {
    final positions = ['cun', 'guan', 'chi'];
    final positionNames = {'cun': '寸', 'guan': '关', 'chi': '尺'};
    final levels = ['fu', 'zhong', 'chen'];
    final levelNames = {'fu': '浮', 'zhong': '中', 'chen': '沉'};

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        Table(
          border: TableBorder.all(),
          columnWidths: const {
            0: FlexColumnWidth(1),
            1: FlexColumnWidth(1),
            2: FlexColumnWidth(1),
            3: FlexColumnWidth(1),
          },
          children: [
            TableRow(
              children: [
                _buildCell(''),
                _buildCell('寸'),
                _buildCell('关'),
                _buildCell('尺'),
              ],
            ),
            ...levels.map((level) => TableRow(
              children: [
                _buildCell(levelNames[level] ?? level),
                ...positions.map((pos) => _buildPulseCell(hand, pos, level)),
              ],
            )),
          ],
        ),
      ],
    );
  }

  Widget _buildCell(String text) {
    return Padding(
      padding: const EdgeInsets.all(8),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildPulseCell(String hand, String pos, String level) {
    final key = '$hand-$pos-$level';
    final controller = _controllers[key]!;

    return InkWell(
      onTap: () => _showPulsePicker(key, controller),
      child: Container(
        padding: const EdgeInsets.all(8),
        child: TextField(
          controller: controller,
          textAlign: TextAlign.center,
          readOnly: true,
          decoration: const InputDecoration(
            border: InputBorder.none,
            contentPadding: EdgeInsets.zero,
          ),
          style: TextStyle(
            fontSize: 16,
            color: controller.text.isNotEmpty ? Colors.teal : Colors.grey,
            fontWeight: controller.text.isNotEmpty ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}
