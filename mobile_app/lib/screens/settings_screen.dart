import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../models/patient.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final TextEditingController _urlController = TextEditingController();
  bool _isLoading = false;
  bool? _connectionStatus;

  @override
  void initState() {
    super.initState();
    _loadCurrentUrl();
  }

  Future<void> _loadCurrentUrl() async {
    final apiService = context.read<ApiService>();
    _urlController.text = apiService.baseUrl;
  }

  Future<void> _testConnection() async {
    setState(() {
      _isLoading = true;
      _connectionStatus = null;
    });

    try {
      final apiService = context.read<ApiService>();
      final url = _urlController.text.trim();
      if (url.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('请输入API地址')),
          );
        }
        return;
      }

      await apiService.setBaseUrl(url);
      final connected = await apiService.testConnection();

      setState(() {
        _connectionStatus = connected;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(connected ? '连接成功' : '连接失败'),
            backgroundColor: connected ? Colors.green : Colors.red,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _connectionStatus = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('连接错误: $e')),
        );
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
        title: const Text('设置'),
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Icon(
                        Icons.info_outline,
                        color: Colors.teal,
                      ),
                      SizedBox(width: 8),
                      const Text(
                        '应用信息',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const ListTile(
                    title: Text('应用名称'),
                    subtitle: Text('中医脉象九宫格OCR识别系统'),
                  ),
                  const ListTile(
                    title: Text('版本'),
                    subtitle: Text('1.0.0'),
                  ),
                  const ListTile(
                    title: Text('支持平台'),
                    subtitle: Text('Android · iOS · HarmonyOS'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Icon(
                        Icons.settings_ethernet,
                        color: Colors.teal,
                      ),
                      SizedBox(width: 8),
                      const Text(
                        'API设置',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _urlController,
                    decoration: InputDecoration(
                      labelText: 'API地址',
                      hintText: 'http://localhost:8000',
                      border: const OutlineInputBorder(),
                      suffixIcon: _connectionStatus != null
                          ? Icon(
                              _connectionStatus!
                                  ? Icons.check_circle
                                  : Icons.error,
                              color: _connectionStatus!
                                  ? Colors.green
                                  : Colors.red,
                            )
                          : null,
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isLoading ? null : _testConnection,
                      icon: _isLoading
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.link),
                      label: const Text('测试连接'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        textStyle: const TextStyle(fontSize: 16),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Icon(
                        Icons.phone_android,
                        color: Colors.teal,
                      ),
                      SizedBox(width: 8),
                      const Text(
                        '设备信息',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  FutureBuilder(
                    future: _getDeviceInfo(),
                    builder: (context, snapshot) {
                      if (snapshot.hasData) {
                        final info = snapshot.data!;
                        return Column(
                          children: [
                            ListTile(
                              title: const Text('平台'),
                              subtitle: Text(info['platform'] ?? 'Unknown'),
                            ),
                            ListTile(
                              title: const Text('当前API'),
                              subtitle: Text(_urlController.text),
                            ),
                            if (info['model'] != null)
                              ListTile(
                                title: const Text('设备型号'),
                                subtitle: Text(info['model']!),
                              ),
                            if (info['os'] != null)
                              ListTile(
                                title: const Text('操作系统'),
                                subtitle: Text(info['os']!),
                              ),
                          ],
                        );
                      }
                      return const CircularProgressIndicator();
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<Map<String, String>> _getDeviceInfo() async {
    return {
      'platform': Theme.of(context).platform.toString(),
      'model': 'Unknown',
      'os': 'Unknown',
    };
  }
}
