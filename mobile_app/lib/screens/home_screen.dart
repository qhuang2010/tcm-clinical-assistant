import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/patient_provider.dart';
import '../utils/common_utils.dart';
import 'patient_list_screen.dart';
import 'pulse_input_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  bool _isLoading = false;
  String? _connectionStatus;

  final List<Widget> _screens = const [
    PatientListScreen(),
    PulseInputScreen(),
    SettingsScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _testConnection();
  }

  Future<void> _testConnection() async {
    setState(() {
      _isLoading = true;
      _connectionStatus = null;
    });

    final apiService = context.read<ApiService>();
    final connected = await apiService.testConnection();

    setState(() {
      _isLoading = false;
      _connectionStatus = connected ? '已连接' : '未连接';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('中医脉象九宫格'),
        elevation: 0,
        actions: [
          if (_connectionStatus != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Center(
                child: Text(
                  _connectionStatus!,
                  style: TextStyle(
                    color: _connectionStatus == '已连接'
                        ? Colors.green
                        : Colors.red,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _testConnection,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _screens[_selectedIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.people),
            label: '患者',
          ),
          NavigationDestination(
            icon: Icon(Icons.grid_on),
            label: '脉象',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings),
            label: '设置',
          ),
        ],
      ),
    );
  }
}
