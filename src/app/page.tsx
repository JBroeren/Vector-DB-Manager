'use client';

import { useState, useEffect } from 'react';
import { 
  Database, Search, Plus, Settings, RotateCcw, BarChart3, 
  Trash2, Edit, Eye, MoreHorizontal, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Maximize2, Activity, Server,
  CheckCircle, AlertCircle, XCircle, Clock, Zap, Sun, Moon, Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WeaviateClass {
  class: string;
  properties?: Array<{
    name: string;
    dataType: string[];
  }>;
}

interface DatabaseStats {
  version: string;
  totalClasses: number;
  totalObjects: number;
  classStats: Array<{
    name: string;
    objectCount: number;
    properties: number;
  }>;
  modules: any;
  nodeInfo: string;
  clusterHealth?: {
    nodes: Array<{
      name: string;
      status: string;
      version: string;
      gitHash: string;
      stats: {
        shardCount: number;
        objectCount: number;
      };
      batchStats: {
        ratePerSecond: number;
      };
      shards: Array<{
        name: string;
        class: string;
        objectCount: number;
        vectorIndexingStatus: string;
        vectorQueueLength: number;
      }>;
    }>;
    synchronized: boolean;
    statistics: any[];
  };
  performanceMetrics?: {
    totalNodes: number;
    healthyNodes: number;
    totalShards: number;
    indexingShards: number;
    totalBatchRate: number;
    totalVectorQueue: number;
  };
  shardDetails?: Array<{
    nodeName: string;
    shardName: string;
    className: string;
    objectCount: number;
    vectorIndexingStatus: string;
    vectorQueueLength: number;
  }>;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

export default function Home() {
  const [classes, setClasses] = useState<WeaviateClass[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [objects, setObjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingObject, setViewingObject] = useState<any>(null);
  const [editingObject, setEditingObject] = useState<any>(null);
  const [newObjectProperties, setNewObjectProperties] = useState<any>({});
  const [selectedObjects, setSelectedObjects] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newClassProperties, setNewClassProperties] = useState([{ name: '', dataType: 'string' }]);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    pageSize: 20,
    totalItems: 0
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  useEffect(() => {
    checkConnection();
    fetchClasses();
    fetchStats();
    
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('weaviate-manager-theme') as 'light' | 'dark' | 'system';
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme('system');
    }

    // Load auto-refresh settings
    const savedAutoRefresh = localStorage.getItem('weaviate-manager-autorefresh') === 'true';
    const savedInterval = parseInt(localStorage.getItem('weaviate-manager-refresh-interval') || '30');
    setAutoRefresh(savedAutoRefresh);
    setRefreshInterval(savedInterval);
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || activeTab !== 'stats') return;

    const interval = setInterval(() => {
      fetchStats();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, activeTab]);

  const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('weaviate-manager-theme', newTheme);
    applyTheme(newTheme);
  };

  const handleAutoRefreshChange = (enabled: boolean) => {
    setAutoRefresh(enabled);
    localStorage.setItem('weaviate-manager-autorefresh', enabled.toString());
  };

  const handleRefreshIntervalChange = (seconds: number) => {
    setRefreshInterval(seconds);
    localStorage.setItem('weaviate-manager-refresh-interval', seconds.toString());
  };

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/weaviate/status');
      const data = await response.json();
      setIsConnected(data.connected);
    } catch (error) {
      setIsConnected(false);
    }
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/weaviate/classes');
      const data = await response.json();
      setClasses(data.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/weaviate/enhanced-stats');
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching enhanced stats:', error);
      // Fallback to basic stats
      try {
        const fallbackResponse = await fetch('/api/weaviate/stats');
        const fallbackData = await fallbackResponse.json();
        setStats(fallbackData.stats);
      } catch (fallbackError) {
        console.error('Error fetching fallback stats:', error);
      }
    }
  };

  const fetchObjects = async (className: string, page: number = 1) => {
    try {
      const offset = (page - 1) * pagination.pageSize;
      const response = await fetch(`/api/weaviate/objects/${className}?limit=${pagination.pageSize}&offset=${offset}`);
      const data = await response.json();
      
      console.log('Fetched objects for', className, 'page', page, ':', data); // Debug log
      
      setObjects(data.objects || []);
      if (data.pagination) {
        setPagination(prev => ({
          ...prev,
          currentPage: data.pagination.currentPage,
          totalPages: data.pagination.totalPages,
          totalItems: data.pagination.totalItems,
          pageSize: data.pagination.pageSize
        }));
      }
    } catch (error) {
      console.error('Error fetching objects:', error);
      setObjects([]);
    }
  };

  const handleClassSelect = (className: string) => {
    setSelectedClass(className);
    setSelectedObjects(new Set());
    setSearchQuery('');
    // Reset pagination to page 1
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchObjects(className, 1);
  };

  const handlePageChange = (newPage: number) => {
    if (selectedClass && newPage >= 1 && newPage <= pagination.totalPages) {
      fetchObjects(selectedClass, newPage);
    }
  };

  const handleSearch = async () => {
    if (!selectedClass || !searchQuery.trim()) {
      fetchObjects(selectedClass, 1);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch('/api/weaviate/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: selectedClass,
          query: searchQuery,
          limit: 50
        })
      });
      const data = await response.json();
      setObjects(data.results || []);
      
      // Reset pagination for search results
      setPagination(prev => ({
        ...prev,
        currentPage: 1,
        totalPages: 1,
        totalItems: data.results?.length || 0
      }));
    } catch (error) {
      console.error('Error searching objects:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    fetchObjects(selectedClass, 1);
  };

  const handleCreateObject = async () => {
    if (!selectedClass) return;
    
    try {
      const response = await fetch(`/api/weaviate/objects/${selectedClass}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties: newObjectProperties })
      });
      
      if (response.ok) {
        setShowCreateModal(false);
        setNewObjectProperties({});
        fetchObjects(selectedClass);
        fetchStats();
      }
    } catch (error) {
      console.error('Error creating object:', error);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassName) return;
    
    const classDefinition = {
      class: newClassName,
      properties: newClassProperties.filter(p => p.name).map(p => ({
        name: p.name,
        dataType: [p.dataType]
      }))
    };
    
    try {
      const response = await fetch('/api/weaviate/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classDefinition)
      });
      
      if (response.ok) {
        setShowCreateClassModal(false);
        setNewClassName('');
        setNewClassProperties([{ name: '', dataType: 'string' }]);
        fetchClasses();
        fetchStats();
      }
    } catch (error) {
      console.error('Error creating class:', error);
    }
  };

  const handleDeleteClass = async (className: string) => {
    try {
      const response = await fetch(`/api/weaviate/classes/${className}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchClasses();
        fetchStats();
        if (selectedClass === className) {
          setSelectedClass('');
          setObjects([]);
        }
      }
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  const handleViewObject = (obj: any) => {
    setViewingObject(obj);
    setShowViewModal(true);
  };

  const handleEditObject = (obj: any) => {
    setEditingObject(obj);
    setNewObjectProperties(obj.properties || {});
    setShowEditModal(true);
  };

  const handleUpdateObject = async () => {
    if (!editingObject || !selectedClass) return;
    
    try {
      const response = await fetch(`/api/weaviate/objects/${selectedClass}/${editingObject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties: newObjectProperties })
      });
      
      if (response.ok) {
        setShowEditModal(false);
        setEditingObject(null);
        setNewObjectProperties({});
        fetchObjects(selectedClass);
      }
    } catch (error) {
      console.error('Error updating object:', error);
    }
  };

  const handleDeleteObject = async (objectId: string) => {
    if (!selectedClass) return;
    
    try {
      const response = await fetch(`/api/weaviate/objects/${selectedClass}/${objectId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchObjects(selectedClass);
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting object:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedObjects.size === 0) return;
    
    const confirmDelete = confirm(`Delete ${selectedObjects.size} selected objects?`);
    if (!confirmDelete) return;
    
    try {
      for (const objectId of selectedObjects) {
        await handleDeleteObject(objectId);
      }
      setSelectedObjects(new Set());
    } catch (error) {
      console.error('Error in bulk delete:', error);
    }
  };

  const getClassProperties = () => {
    const selectedClassData = classes.find(cls => cls.class === selectedClass);
    return selectedClassData?.properties || [];
  };

  const toggleObjectSelection = (objectId: string) => {
    const newSelection = new Set(selectedObjects);
    if (newSelection.has(objectId)) {
      newSelection.delete(objectId);
    } else {
      newSelection.add(objectId);
    }
    setSelectedObjects(newSelection);
  };

  const formatObjectProperties = (properties: any) => {
    if (!properties) return 'No properties';
    
    const formatted = Object.entries(properties)
      .map(([key, value]) => {
        if (typeof value === 'string' && value.length > 100) {
          return `${key}: "${value.substring(0, 100)}..."`;
        }
        return `${key}: ${JSON.stringify(value)}`;
      })
      .join('\n');
    
    return formatted || 'Empty object';
  };

  const highlightSearchText = (text: string, searchTerm: string): JSX.Element => {
    if (!searchTerm || !text) {
      return <span>{text}</span>;
    }

    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return (
      <span>
        {parts.map((part, index) => 
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Compact Header */}
      <header className="border-b bg-card px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Database className="h-6 w-6 text-primary mr-2" />
              <h1 className="text-xl font-bold">Weaviate Manager</h1>
            </div>
            <div className={`flex items-center space-x-2 px-2 py-1 rounded text-sm ${
              isConnected 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={fetchStats} variant="ghost" size="sm">
              <RotateCcw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium">Theme</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <Button
                        variant={theme === 'light' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleThemeChange('light')}
                        className="flex items-center space-x-2"
                      >
                        <Sun className="h-4 w-4" />
                        <span>Light</span>
                      </Button>
                      <Button
                        variant={theme === 'dark' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleThemeChange('dark')}
                        className="flex items-center space-x-2"
                      >
                        <Moon className="h-4 w-4" />
                        <span>Dark</span>
                      </Button>
                      <Button
                        variant={theme === 'system' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleThemeChange('system')}
                        className="flex items-center space-x-2"
                      >
                        <Monitor className="h-4 w-4" />
                        <span>System</span>
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Auto-refresh Statistics</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={(e) => handleAutoRefreshChange(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Enable auto-refresh</span>
                    </div>
                    {autoRefresh && (
                      <div className="mt-3">
                        <Label className="text-xs text-muted-foreground">Refresh Interval</Label>
                        <select
                          value={refreshInterval}
                          onChange={(e) => handleRefreshIntervalChange(parseInt(e.target.value))}
                          className="mt-1 block w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm"
                        >
                          <option value={15}>15 seconds</option>
                          <option value={30}>30 seconds</option>
                          <option value={60}>1 minute</option>
                          <option value={120}>2 minutes</option>
                          <option value={300}>5 minutes</option>
                        </select>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <div className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="mb-4">
            <TabsTrigger value="stats" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="browser" className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Data Browser
            </TabsTrigger>
          </TabsList>

          {/* Data Browser Tab */}
          <TabsContent value="browser" className="space-y-4">
            <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
              {/* Classes Sidebar - Compact */}
              <div className="col-span-3">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Collections</CardTitle>
                      <div className="flex space-x-1">
                        <Dialog open={showCreateClassModal} onOpenChange={setShowCreateClassModal}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Plus className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create Collection</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Collection Name</Label>
                                <Input
                                  value={newClassName}
                                  onChange={(e) => setNewClassName(e.target.value)}
                                  placeholder="MyCollection"
                                />
                              </div>
                              <div>
                                <Label>Properties</Label>
                                {newClassProperties.map((prop, index) => (
                                  <div key={index} className="flex space-x-2 mt-2">
                                    <Input
                                      placeholder="Property name"
                                      value={prop.name}
                                      onChange={(e) => {
                                        const updated = [...newClassProperties];
                                        updated[index].name = e.target.value;
                                        setNewClassProperties(updated);
                                      }}
                                    />
                                    <select
                                      value={prop.dataType}
                                      onChange={(e) => {
                                        const updated = [...newClassProperties];
                                        updated[index].dataType = e.target.value;
                                        setNewClassProperties(updated);
                                      }}
                                      className="px-3 py-2 border rounded-md"
                                    >
                                      <option value="string">String</option>
                                      <option value="number">Number</option>
                                      <option value="boolean">Boolean</option>
                                      <option value="text">Text</option>
                                    </select>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => setNewClassProperties([...newClassProperties, { name: '', dataType: 'string' }])}
                                >
                                  Add Property
                                </Button>
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setShowCreateClassModal(false)}>Cancel</Button>
                                <Button onClick={handleCreateClass}>Create</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button onClick={fetchClasses} size="sm" variant="ghost">
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="py-0">
                    <ScrollArea className="h-[calc(100vh-320px)]">
                      <div className="space-y-1">
                        {loading ? (
                          [...Array(3)].map((_, i) => (
                            <div key={i} className="h-8 bg-muted rounded animate-pulse" />
                          ))
                        ) : (
                          classes.map((cls) => (
                            <div key={cls.class} className="flex items-center justify-between">
                              <Button
                                onClick={() => handleClassSelect(cls.class)}
                                variant={selectedClass === cls.class ? "default" : "ghost"}
                                size="sm"
                                className="flex-1 justify-start text-sm"
                              >
                                {cls.class}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => handleClassSelect(cls.class)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Objects
                                  </DropdownMenuItem>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Collection
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete the "{cls.class}" collection? This will permanently delete all objects in this collection.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteClass(cls.class)}>
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Objects Panel - Enhanced */}
              <div className="col-span-9">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg">
                          {selectedClass ? `${selectedClass}` : 'Select a collection'}
                        </CardTitle>
                        {selectedClass && (
                          <Badge variant="secondary">
                            {pagination.totalItems} objects
                          </Badge>
                        )}
                        {searchQuery && (
                          <Badge variant="outline">
                            Search: "{searchQuery}"
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedObjects.size > 0 && (
                          <Button onClick={handleBulkDelete} variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete ({selectedObjects.size})
                          </Button>
                        )}
                        <div className="flex items-center space-x-1">
                          <Input
                            placeholder="Search objects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-48"
                          />
                          <Button 
                            onClick={handleSearch}
                            disabled={!selectedClass || isSearching}
                            variant="outline"
                            size="sm"
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                          {searchQuery && (
                            <Button 
                              onClick={clearSearch}
                              variant="ghost"
                              size="sm"
                            >
                              Clear
                            </Button>
                          )}
                        </div>
                        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                          <DialogTrigger asChild>
                            <Button disabled={!selectedClass} size="sm">
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create Object in {selectedClass}</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="max-h-96">
                              <div className="space-y-4 pr-4">
                                {getClassProperties().map((prop) => (
                                  <div key={prop.name}>
                                    <Label>{prop.name} ({prop.dataType.join(', ')})</Label>
                                    <Input
                                      value={newObjectProperties[prop.name] || ''}
                                      onChange={(e) => setNewObjectProperties({
                                        ...newObjectProperties,
                                        [prop.name]: e.target.value
                                      })}
                                      placeholder={`Enter ${prop.name}...`}
                                    />
                                  </div>
                                ))}
                                <div className="flex justify-end space-x-2 pt-4">
                                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                                  <Button onClick={handleCreateObject}>Create</Button>
                                </div>
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="py-0 flex-1 flex flex-col">
                    {selectedClass ? (
                      <>
                        <div className="flex-1 overflow-hidden">
                          <ScrollArea className="h-[calc(100vh-430px)]">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-12">
                                    <input
                                      type="checkbox"
                                      checked={selectedObjects.size === objects.length && objects.length > 0}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedObjects(new Set(objects.map(obj => obj.id)));
                                        } else {
                                          setSelectedObjects(new Set());
                                        }
                                      }}
                                    />
                                  </TableHead>
                                  <TableHead className="w-32">ID</TableHead>
                                  <TableHead>Properties</TableHead>
                                  <TableHead className="w-32">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {objects.map((obj, index) => (
                                  <TableRow key={obj.id || index}>
                                    <TableCell>
                                      <input
                                        type="checkbox"
                                        checked={selectedObjects.has(obj.id)}
                                        onChange={() => toggleObjectSelection(obj.id)}
                                      />
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                      {obj.id?.slice(0, 8)}...
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-xs bg-muted p-2 rounded w-full">
                                        <pre className="whitespace-pre-wrap text-xs break-all">
                                          {searchQuery ? 
                                            highlightSearchText(formatObjectProperties(obj.properties), searchQuery) :
                                            formatObjectProperties(obj.properties)
                                          }
                                        </pre>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex space-x-1">
                                        <Button 
                                          onClick={() => handleViewObject(obj)}
                                          variant="outline"
                                          size="sm"
                                          title="View Details"
                                        >
                                          <Maximize2 className="h-3 w-3" />
                                        </Button>
                                        <Button 
                                          onClick={() => handleEditObject(obj)}
                                          variant="outline"
                                          size="sm"
                                          title="Edit"
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button 
                                          onClick={() => handleDeleteObject(obj.id)}
                                          variant="destructive"
                                          size="sm"
                                          title="Delete"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            {objects.length === 0 && (
                              <div className="text-center py-12 text-muted-foreground">
                                <Database className="mx-auto h-12 w-12 mb-4" />
                                <p>{searchQuery ? 'No matching objects found' : 'No objects found'}</p>
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                        
                        {/* Pagination Controls */}
                        {pagination.totalPages > 1 && (
                          <div className="mt-4 flex items-center justify-between border-t pt-4">
                            <div className="text-sm text-muted-foreground">
                              Page {pagination.currentPage} of {pagination.totalPages}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => handlePageChange(1)}
                                disabled={pagination.currentPage === 1}
                                variant="outline"
                                size="sm"
                              >
                                <ChevronsLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                                variant="outline"
                                size="sm"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <span className="px-4 py-2 text-sm">
                                {pagination.currentPage}
                              </span>
                              <Button
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages}
                                variant="outline"
                                size="sm"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handlePageChange(pagination.totalPages)}
                                disabled={pagination.currentPage === pagination.totalPages}
                                variant="outline"
                                size="sm"
                              >
                                <ChevronsRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground flex-1 flex items-center justify-center">
                        <div>
                          <Database className="mx-auto h-12 w-12 mb-4" />
                          <p>Select a collection to view objects</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-4">
            {/* Basic Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    Total Collections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Total Objects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalObjects || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Version
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{stats?.version || 'Unknown'}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Server className="h-4 w-4 mr-2" />
                    Node
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-mono">{stats?.nodeInfo || 'Unknown'}</div>
                </CardContent>
              </Card>
            </div>

            {/* Cluster Health */}
            {stats?.clusterHealth && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Server className="h-4 w-4 mr-2" />
                      Cluster Nodes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.performanceMetrics?.totalNodes || 0}</div>
                    <div className="text-xs text-muted-foreground">
                      {stats.performanceMetrics?.healthyNodes || 0} healthy
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Activity className="h-4 w-4 mr-2" />
                      Total Shards
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.performanceMetrics?.totalShards || 0}</div>
                    <div className="text-xs text-muted-foreground">
                      {stats.performanceMetrics?.indexingShards || 0} indexing
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Zap className="h-4 w-4 mr-2" />
                      Batch Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.performanceMetrics?.totalBatchRate?.toFixed(1) || '0.0'}</div>
                    <div className="text-xs text-muted-foreground">ops/sec</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Vector Queue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.performanceMetrics?.totalVectorQueue || 0}</div>
                    <div className="text-xs text-muted-foreground">pending</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Node Health Status */}
            {stats?.clusterHealth?.nodes && stats.clusterHealth.nodes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Server className="h-5 w-5 mr-2" />
                    Node Health Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.clusterHealth.nodes.map((node, index) => (
                      <div key={node.name || index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            {node.status === 'HEALTHY' && <CheckCircle className="h-5 w-5 text-green-500" />}
                            {node.status === 'INDEXING' && <Clock className="h-5 w-5 text-yellow-500" />}
                            {node.status === 'UNHEALTHY' && <AlertCircle className="h-5 w-5 text-red-500" />}
                            {node.status === 'UNAVAILABLE' && <XCircle className="h-5 w-5 text-gray-500" />}
                          </div>
                          <div>
                            <div className="font-medium">{node.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {node.version} • {node.gitHash?.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {node.stats?.shardCount || 0} shards
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(node.batchStats?.ratePerSecond || 0).toFixed(1)} ops/sec
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shard Details */}
            {stats?.shardDetails && stats.shardDetails.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Shard Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Node</TableHead>
                        <TableHead>Collection</TableHead>
                        <TableHead>Shard</TableHead>
                        <TableHead>Objects</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Queue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.shardDetails.map((shard, index) => (
                        <TableRow key={`${shard.nodeName}-${shard.shardName}`}>
                          <TableCell className="font-medium">{shard.nodeName}</TableCell>
                          <TableCell>{shard.className}</TableCell>
                          <TableCell className="font-mono text-xs">{shard.shardName.slice(0, 8)}...</TableCell>
                          <TableCell>{shard.objectCount}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {shard.vectorIndexingStatus === 'READY' && <CheckCircle className="h-4 w-4 text-green-500" />}
                              {shard.vectorIndexingStatus === 'INDEXING' && <Clock className="h-4 w-4 text-yellow-500" />}
                              <span className="text-xs">{shard.vectorIndexingStatus}</span>
                            </div>
                          </TableCell>
                          <TableCell>{shard.vectorQueueLength}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Collection Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Collection Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Collection</TableHead>
                      <TableHead>Objects</TableHead>
                      <TableHead>Properties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats?.classStats?.map((stat) => (
                      <TableRow key={stat.name}>
                        <TableCell className="font-medium">{stat.name}</TableCell>
                        <TableCell>{stat.objectCount}</TableCell>
                        <TableCell>{stat.properties}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Object Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Object Details</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Object ID</Label>
                <div className="mt-1 p-2 bg-muted rounded font-mono text-sm">
                  {viewingObject?.id}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Properties</Label>
                <div className="mt-1 p-4 bg-muted rounded">
                  <pre className="text-sm whitespace-pre-wrap">
                    {searchQuery ? 
                      highlightSearchText(JSON.stringify(viewingObject?.properties, null, 2), searchQuery) :
                      JSON.stringify(viewingObject?.properties, null, 2)
                    }
                  </pre>
                </div>
              </div>
              {viewingObject?._additional && (
                <div>
                  <Label className="text-sm font-medium">Additional Information</Label>
                  <div className="mt-1 p-4 bg-muted rounded">
                    <pre className="text-sm whitespace-pre-wrap">
                      {searchQuery ? 
                        highlightSearchText(JSON.stringify(viewingObject._additional, null, 2), searchQuery) :
                        JSON.stringify(viewingObject._additional, null, 2)
                      }
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Object Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Object</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="space-y-4 pr-4">
              {getClassProperties().map((prop) => (
                <div key={prop.name}>
                  <Label>{prop.name} ({prop.dataType.join(', ')})</Label>
                  <Input
                    value={newObjectProperties[prop.name] || ''}
                    onChange={(e) => setNewObjectProperties({
                      ...newObjectProperties,
                      [prop.name]: e.target.value
                    })}
                    placeholder={`Enter ${prop.name}...`}
                  />
                </div>
              ))}
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
                <Button onClick={handleUpdateObject}>Update</Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}