import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { 
  getTasks, getTimeEntriesByUserId, addTimeEntry, 
  setStateFromPromise 
} from '../utils/dataService';
import { useAuth } from '../components/auth/useAuth';
import { Task, TimeEntry } from '../utils/types';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';
import { Clock, Calendar, PlusCircle, Timer, Save, Eye, Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import TimeTrackingForm from '@/components/TimeTracking/TimeTrackingForm';

const TimeTracking = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      if (currentUser) {
        try {
          const fetchedTasks = await getTasks();
          const userTasks = currentUser.role === 'worker'
            ? fetchedTasks.filter(task => task.assignments.some(a => a.userId === currentUser.id))
            : fetchedTasks;
          
          setTasks(userTasks);
          
          // Convert user ID to string for the API call
          const fetchedEntries = await getTimeEntriesByUserId(String(currentUser.id));
          setTimeEntries(fetchedEntries);
        } catch (error) {
          console.error('Error fetching data:', error);
          toast({
            title: 'Error',
            description: 'No se pudieron cargar los datos',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchData();
  }, [currentUser]);
  
  const handleTimeEntryAdded = (entry: TimeEntry) => {
    setTimeEntries([...timeEntries, entry]);
    setIsAddingEntry(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin">
            <Clock className="h-8 w-8 text-primary" />
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rexistro de horas</h1>
            <p className="text-muted-foreground mt-1">
              Rexistra o tempo traballado nas túas tarefas asignadas
            </p>
          </div>
          <Button 
            className="mt-4 sm:mt-0" 
            onClick={() => setIsAddingEntry(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Rexistrar horas
          </Button>
        </div>
        
        {isAddingEntry && currentUser && (
          <TimeTrackingForm 
            tasks={tasks}
            onEntryAdded={handleTimeEntryAdded}
            onCancel={() => setIsAddingEntry(false)}
            userId={currentUser.id}
          />
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Historial de horas rexistradas</CardTitle>
            <CardDescription>
              Visualiza e xestiona os teus rexistros de horas traballadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarefa</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Accións</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.length > 0 ? (
                    timeEntries.map((entry) => {
                      const task = tasks.find(t => t.id === entry.taskId);
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4 text-primary" />
                              <span>{task?.title || 'Tarefa non atopada'}</span>
                            </div>
                          </TableCell>
                          <TableCell>{format(new Date(entry.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{entry.hours} horas</TableCell>
                          <TableCell>
                            <span className="truncate block max-w-[200px]">
                              {entry.notes || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Accións</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Accións</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => navigate(`/tasks/${task?.id}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver tarefa
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar rexistro
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-500">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center py-8">
                          <Timer className="h-10 w-10 text-muted-foreground/50 mb-4" />
                          <p className="text-sm text-muted-foreground">Non rexistraches horas aínda</p>
                          <Button 
                            variant="outline" 
                            className="mt-4" 
                            onClick={() => setIsAddingEntry(true)}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Rexistrar horas
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Resumo de horas por tarefa</CardTitle>
            <CardDescription>
              Visualiza o progreso das túas horas en cada tarefa asignada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {tasks.map(task => {
                const taskEntries = timeEntries.filter(entry => entry.taskId === task.id);
                const totalHoursWorked = taskEntries.reduce((sum, entry) => sum + entry.hours, 0);
                const taskAssignment = task.assignments.find(a => currentUser && a.userId === currentUser.id);
                const allocatedHours = taskAssignment?.allocatedHours || 0;
                
                const progress = allocatedHours > 0 
                  ? Math.min(Math.round((totalHoursWorked / allocatedHours) * 100), 100) 
                  : 0;
                
                return (
                  <div key={task.id} className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg mb-1">{task.title}</h3>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="mr-1.5 h-4 w-4" />
                          <span>Estado: {task.status === 'completed' ? 'Completada' : task.status === 'in_progress' ? 'En progreso' : 'Pendente'}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:items-end">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/tasks/${task.id}`)}>
                          <Eye className="mr-2 h-3 w-3" />
                          Ver detalles
                        </Button>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progreso: {progress}%</span>
                        <span>{totalHoursWorked} / {allocatedHours} horas</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${progress}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">Non tes tarefas asignadas</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TimeTracking;
