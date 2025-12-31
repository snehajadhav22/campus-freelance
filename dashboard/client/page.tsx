// app/dashboard/client/page.tsx

// This is client page
"use client"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Plus,
  Search,
  Filter,
  Users,
  Briefcase,
  Clock,
  DollarSign,
  Star,
  MessageSquare,
  Eye,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Loader2,
  Mail,
  MapPin,
  Calendar,
  ChevronRight,
  CreditCard,
  Shield,
  Zap,
  FileText,
  XCircle,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { PostProjectModal } from "@/components/modals/post-project-modal"
import { PaymentButton } from "@/components/payment/PaymentButton"
import { toast } from "sonner"

interface Project {
  _id: string
  title: string
  description: string
  budget: {
    min: number
    max: number
    currency: string
  }
  duration: string
  skills: string[]
  category: string
  status: string
  applicants: string[]
  proposals: number
  views: number
  paymentStatus: 'unpaid' | 'paid' | 'partially_paid' | 'released'
  escrowId?: string
  featured?: boolean
  featuredUntil?: string
  createdAt: string
  updatedAt: string
}

interface Application {
  _id: string
  projectId: string
  studentId: string
  studentName: string
  studentAvatar?: string
  proposal: string
  bidAmount: number
  estimatedDuration: string
  status: 'pending' | 'accepted' | 'rejected' | 'hired'
  paid: boolean
  paymentId?: string
  createdAt: string
}

interface Freelancer {
  _id: string
  name: string
  role: string
  avatar: string
  rating: number
  hourlyRate: number
  completedProjects: number
  responseTime: string
  skills: string[]
  location: string
  availability: 'available' | 'busy' | 'offline'
  bio: string
  profileBoost?: {
    active: boolean
    expiresAt: string
  }
}

interface DashboardStats {
  activeProjects: number
  totalProjects: number
  completedProjects: number
  totalSpent: number
  hiredFreelancers: number
  avgResponseTime: string
  pendingPayments: number
  totalPaid: number
}

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [freelancers, setFreelancers] = useState<Freelancer[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPostModal, setShowPostModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projectApplications, setProjectApplications] = useState<Application[]>([])
  const [showApplicationsModal, setShowApplicationsModal] = useState(false)
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  
  const { user, userData, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  // Fetch all dashboard data
  useEffect(() => {
    const fetchData = async () => {
      if (user && userData) {
        try {
          setLoading(true)
          
          // Fetch projects with payment status
          const projectsRes = await fetch(`/api/projects?clientId=${user.uid}`)
          const projectsData = await projectsRes.json()
          if (projectsData.success) {
            setProjects(projectsData.data)
          }
          
          // Fetch stats with payment data
          const statsRes = await fetch(`/api/dashboard/client/stats?clientId=${user.uid}`)
          const statsData = await statsRes.json()
          if (statsData.success) {
            setStats(statsData.data)
          }

          // Fetch freelancers
          const freelancersRes = await fetch('/api/freelancers')
          const freelancersData = await freelancersRes.json()
          if (freelancersData.success) {
            setFreelancers(freelancersData.data)
          }
        } catch (error) {
          console.error('Error fetching data:', error)
          toast.error('Failed to load dashboard data')
        } finally {
          setLoading(false)
        }
      }
    }
    
    if (user && userData) {
      fetchData()
    }
  }, [user, userData])

  // Fetch applications for a project
  const fetchProjectApplications = async (projectId: string) => {
    try {
      const response = await fetch(`/api/applications?projectId=${projectId}`)
      const data = await response.json()
      if (data.success) {
        setProjectApplications(data.data)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to load applications')
    }
  }

  // Handle view proposals
  const handleViewProposals = async (project: Project) => {
    setSelectedProject(project)
    await fetchProjectApplications(project._id)
    setShowApplicationsModal(true)
  }

  // Handle accept application
  const handleAcceptApplication = async (application: Application) => {
    try {
      const response = await fetch(`/api/applications/${application._id}/accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: user?.uid })
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success('Application accepted!')
        setSelectedApplication(application)
        setShowPaymentConfirm(true)
        fetchProjectApplications(selectedProject?._id || '')
      }
    } catch (error) {
      console.error('Error accepting application:', error)
      toast.error('Failed to accept application')
    }
  }

  // Handle payment success
  const handlePaymentSuccess = async (paymentData: any) => {
    toast.success('Payment successful! Funds are held in escrow.')
    setShowPaymentConfirm(false)
    setShowApplicationsModal(false)
    // Refresh projects to update payment status
    const projectsRes = await fetch(`/api/projects?clientId=${user?.uid}`)
    const projectsData = await projectsRes.json()
    if (projectsData.success) {
      setProjects(projectsData.data)
    }
    // Refresh stats
    const statsRes = await fetch(`/api/dashboard/client/stats?clientId=${user?.uid}`)
    const statsData = await statsRes.json()
    if (statsData.success) {
      setStats(statsData.data)
    }
  }

  // Handle release escrow
  const handleReleaseEscrow = async (project: Project) => {
    try {
      const response = await fetch('/api/payments/release-escrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrowId: project.escrowId,
          clientId: user?.uid,
          reason: 'Project completed successfully'
        })
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success('Funds released to freelancer!')
        // Refresh projects
        const projectsRes = await fetch(`/api/projects?clientId=${user?.uid}`)
        const projectsData = await projectsRes.json()
        if (projectsData.success) {
          setProjects(projectsData.data)
        }
      }
    } catch (error) {
      console.error('Error releasing escrow:', error)
      toast.error('Failed to release funds')
    }
  }

  // Search and filter freelancers
  const handleFreelancerSearch = async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      
      const response = await fetch(`/api/freelancers?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setFreelancers(data.data)
      }
    } catch (error) {
      console.error('Error searching freelancers:', error)
      toast.error('Failed to search freelancers')
    }
  }

  // Trigger search when query or category changes
  useEffect(() => {
    if (activeTab === 'freelancers') {
      handleFreelancerSearch()
    }
  }, [searchQuery, selectedCategory, activeTab])

  const handlePostProject = async (projectData: any) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...projectData,
          clientId: user?.uid,
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Project posted successfully!')
        setProjects([result.data, ...projects])
        setShowPostModal(false)
        // Refresh stats
        const statsRes = await fetch(`/api/dashboard/client/stats?clientId=${user?.uid}`)
        const statsData = await statsRes.json()
        if (statsData.success) {
          setStats(statsData.data)
        }
      } else {
        toast.error(result.message || 'Failed to post project')
      }
    } catch (error) {
      console.error('Error posting project:', error)
      toast.error('Failed to post project')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "in-review":
        return "bg-yellow-500"
      case "completed":
        return "bg-blue-500"
      case "in-progress":
        return "bg-indigo-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className="h-4 w-4" />
      case "in-review":
        return <AlertCircle className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "paid":
        return <Badge className="bg-green-500 text-white border-0">Paid</Badge>
      case "unpaid":
        return <Badge className="bg-red-500 text-white border-0">Unpaid</Badge>
      case "partially_paid":
        return <Badge className="bg-yellow-500 text-white border-0">Partial</Badge>
      case "released":
        return <Badge className="bg-blue-500 text-white border-0">Released</Badge>
      default:
        return null
    }
  }

  const getAvailabilityBadge = (availability: Freelancer['availability']) => {
    switch (availability) {
      case "available":
        return <Badge className="bg-green-500 text-white border-0">Available</Badge>
      case "busy":
        return <Badge className="bg-yellow-500 text-white border-0">Busy</Badge>
      case "offline":
        return <Badge className="bg-gray-500 text-white border-0">Offline</Badge>
    }
  }

  const formatBudget = (budget: Project['budget']) => {
    return `₹${budget.min.toLocaleString('en-IN')} - ₹${budget.max.toLocaleString('en-IN')}`
  }

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const posted = new Date(date)
    const diffInMs = now.getTime() - posted.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return `${Math.floor(diffInDays / 30)} months ago`
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5F4B8B]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F0FF] via-white to-[#FAFAFC] dark:from-[#1A1A2E] dark:via-[#16213E] dark:to-[#1A1A2E]">
      <Navbar onAuthClick={() => {}} isAuthenticated={true} userType="client" />
      
      <div className="pt-20 px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-[#1C1C1E] dark:text-[#F5F5F7] mb-2">
                  Welcome back, {userData?.company || userData?.name}! 🙏
                </h1>
                <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80">
                  Manage your projects and find the perfect Indian talent for your needs
                </p>
              </div>
              <Button 
                onClick={() => setShowPostModal(true)}
                className="bg-gradient-to-r from-[#5F4B8B] to-[#3700B3] hover:from-[#3700B3] hover:to-[#5F4B8B] text-white rounded-2xl px-6 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="mr-2 h-4 w-4" />
                Post New Project
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm border border-[#5F4B8B]/10 dark:border-[#1DE9B6]/20 p-1 rounded-2xl">
              <TabsTrigger
                value="overview"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#5F4B8B] data-[state=active]:to-[#3700B3] data-[state=active]:text-white"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="projects"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#5F4B8B] data-[state=active]:to-[#3700B3] data-[state=active]:text-white"
              >
                My Projects
              </TabsTrigger>
              <TabsTrigger
                value="freelancers"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#5F4B8B] data-[state=active]:to-[#3700B3] data-[state=active]:text-white"
              >
                Find Talent
              </TabsTrigger>
              <TabsTrigger
                value="messages"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#5F4B8B] data-[state=active]:to-[#3700B3] data-[state=active]:text-white"
              >
                Messages
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80 text-sm font-medium">Active Projects</p>
                        <p className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F5F5F7]">
                          {stats?.activeProjects || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-[#5F4B8B] to-[#1DE9B6] rounded-xl flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-500 font-medium">
                        {stats?.totalProjects ? `${((stats.activeProjects / stats.totalProjects) * 100).toFixed(0)}% active` : '0% active'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80 text-sm font-medium">Total Paid</p>
                        <p className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F5F5F7]">
                          ₹{stats?.totalPaid?.toLocaleString('en-IN') || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80">
                        {stats?.pendingPayments || 0} pending payments
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80 text-sm font-medium">Hired Freelancers</p>
                        <p className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F5F5F7]">
                          {stats?.hiredFreelancers || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-sm text-green-500 font-medium">
                        {stats?.completedProjects && stats?.totalProjects ? `${((stats.completedProjects / stats.totalProjects) * 100).toFixed(0)}% success rate` : '0% success rate'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80 text-sm font-medium">Avg Response Time</p>
                        <p className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F5F5F7]">
                          {stats?.avgResponseTime || '2.5h'}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80">From freelancers</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Projects */}
                <div className="lg:col-span-2">
                  <Card className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-[#1C1C1E] dark:text-[#F5F5F7] flex items-center justify-between">
                        Recent Projects
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-[#5F4B8B] dark:text-[#1DE9B6]"
                          onClick={() => setActiveTab('projects')}
                        >
                          View All
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {projects.length === 0 ? (
                        <div className="text-center py-8">
                          <Briefcase className="h-12 w-12 text-[#8E8E93]/50 mx-auto mb-3" />
                          <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80">No projects yet</p>
                          <Button 
                            onClick={() => setShowPostModal(true)}
                            className="mt-4 bg-gradient-to-r from-[#5F4B8B] to-[#3700B3] text-white"
                          >
                            Post Your First Project
                          </Button>
                        </div>
                      ) : (
                        projects.slice(0, 3).map((project) => (
                          <div
                            key={project._id}
                            className="p-4 rounded-xl bg-[#F3F0FF]/50 dark:bg-[#1A1A2E]/50 border border-[#5F4B8B]/10 dark:border-[#1DE9B6]/20 cursor-pointer hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-[#1C1C1E] dark:text-[#F5F5F7]">
                                    {project.title}
                                  </h3>
                                  {project.featured && (
                                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                                      <Zap className="h-3 w-3 mr-1" />
                                      Featured
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80 mb-2 line-clamp-2">
                                  {project.description}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1 items-end">
                                <Badge className={`${getStatusColor(project.status)} text-white border-0`}>
                                  {getStatusIcon(project.status)}
                                  <span className="ml-1 capitalize">{project.status.replace("-", " ")}</span>
                                </Badge>
                                {getPaymentStatusBadge(project.paymentStatus)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-lg font-bold text-[#5F4B8B] dark:text-[#1DE9B6]">
                                {formatBudget(project.budget)}
                              </span>
                              <div className="flex items-center gap-4 text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80">
                                <span>{project.applicants.length} applicants</span>
                                <span>•</span>
                                <span>{project.views} views</span>
                                <span>•</span>
                                <span>{getTimeAgo(project.createdAt)}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {project.skills.slice(0, 3).map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="secondary"
                                  className="bg-[#5F4B8B]/10 text-[#5F4B8B] dark:bg-[#1DE9B6]/10 dark:text-[#1DE9B6] border-0"
                                >
                                  {skill}
                                </Badge>
                              ))}
                              {project.skills.length > 3 && (
                                <Badge variant="secondary" className="bg-[#8E8E93]/10 text-[#8E8E93] border-0">
                                  +{project.skills.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions Sidebar */}
                <div className="space-y-6">
                  <Card className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-[#1C1C1E] dark:text-[#F5F5F7]">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        onClick={() => setShowPostModal(true)}
                                         className="w-full justify-start bg-gradient-to-r from-[#5F4B8B] to-[#3700B3] hover:from-[#3700B3] hover:to-[#5F4B8B] text-white rounded-xl"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Post New Project
                      </Button>
                      <Button
                        onClick={() => setActiveTab('freelancers')}
                        variant="outline"
                        className="w-full justify-start border-[#5F4B8B]/20 dark:border-[#1DE9B6]/30 text-[#5F4B8B] dark:text-[#1DE9B6] hover:bg-[#5F4B8B]/5 dark:hover:bg-[#1DE9B6]/5 rounded-xl bg-transparent"
                      >
                        <Search className="mr-2 h-4 w-4" />
                        Browse Freelancers
                      </Button>
                      <Button
                        onClick={() => setActiveTab('messages')}
                        variant="outline"
                        className="w-full justify-start border-[#5F4B8B]/20 dark:border-[#1DE9B6]/30 text-[#5F4B8B] dark:text-[#1DE9B6] hover:bg-[#5F4B8B]/5 dark:hover:bg-[#1DE9B6]/5 rounded-xl bg-transparent"
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Messages
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Payment Summary Card */}
                  <Card className="border-0 bg-gradient-to-br from-[#5F4B8B]/10 to-[#1DE9B6]/10 backdrop-blur-sm shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-[#1C1C1E] dark:text-[#F5F5F7] flex items-center gap-2">
                        <Shield className="h-5 w-5 text-[#5F4B8B] dark:text-[#1DE9B6]" />
                        Payment Protection
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80">
                        All payments are secured with escrow protection
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#8E8E93] dark:text-[#F5F5F7]/80">In Escrow</span>
                          <span className="font-semibold text-[#5F4B8B] dark:text-[#1DE9B6]">
                            ₹{stats?.totalSpent ? (stats.totalSpent * 0.1).toLocaleString('en-IN') : '0'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#8E8E93] dark:text-[#F5F5F7]/80">Released</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            ₹{stats?.totalPaid?.toLocaleString('en-IN') || '0'}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full text-sm border-[#5F4B8B]/20 dark:border-[#1DE9B6]/30 text-[#5F4B8B] dark:text-[#1DE9B6]"
                      >
                        View Payment History
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* My Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F5F5F7]">My Projects</h2>
                <Button 
                  onClick={() => setShowPostModal(true)}
                  className="bg-gradient-to-r from-[#5F4B8B] to-[#3700B3] hover:from-[#3700B3] hover:to-[#5F4B8B] text-white rounded-2xl"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Post New Project
                </Button>
              </div>

              {projects.length === 0 ? (
                <Card className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg">
                  <CardContent className="py-12 text-center">
                    <Briefcase className="h-16 w-16 text-[#8E8E93]/50 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#1C1C1E] dark:text-[#F5F5F7] mb-2">
                      No projects yet
                    </h3>
                    <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80 mb-6">
                      Start posting projects to find talented Indian freelancers
                    </p>
                    <Button 
                      onClick={() => setShowPostModal(true)}
                      className="bg-gradient-to-r from-[#5F4B8B] to-[#3700B3] text-white"
                    >
                      Post Your First Project
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <Card
                      key={project._id}
                      className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          {/* Left side - project details */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-xl font-bold text-[#1C1C1E] dark:text-[#F5F5F7]">
                                    {project.title}
                                  </h3>
                                  {project.featured && (
                                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                                      <Zap className="h-3 w-3 mr-1" />
                                      Featured
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Badge className={`${getStatusColor(project.status)} text-white border-0 lg:hidden`}>
                                {getStatusIcon(project.status)}
                                <span className="ml-1 capitalize">{project.status.replace("-", " ")}</span>
                              </Badge>
                            </div>
                            <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80 mb-3 line-clamp-2">
                              {project.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80 mb-4">
                              <span>Duration: {project.duration}</span>
                              <span>•</span>
                              <span>Posted: {getTimeAgo(project.createdAt)}</span>
                              <span>•</span>
                              <span className="font-semibold text-[#5F4B8B] dark:text-[#1DE9B6]">
                                {formatBudget(project.budget)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {project.skills.map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="secondary"
                                  className="bg-[#5F4B8B]/10 text-[#5F4B8B] dark:bg-[#1DE9B6]/10 dark:text-[#1DE9B6] border-0"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-[#8E8E93] dark:text-[#F5F5F7]/80">
                                <Users className="h-4 w-4" />
                                <span>{project.applicants.length} applicants</span>
                              </div>
                              <div className="flex items-center gap-1 text-[#8E8E93] dark:text-[#F5F5F7]/80">
                                <MessageSquare className="h-4 w-4" />
                                <span>{project.proposals} proposals</span>
                              </div>
                              <div className="flex items-center gap-1 text-[#8E8E93] dark:text-[#F5F5F7]/80">
                                <Eye className="h-4 w-4" />
                                <span>{project.views} views</span>
                              </div>
                            </div>
                          </div>

                          {/* Right side - status and actions */}
                          <div className="flex flex-col gap-3 lg:ml-6">
                            <div className="flex flex-col gap-2">
                              <Badge className={`${getStatusColor(project.status)} text-white border-0 hidden lg:flex w-fit`}>
                                {getStatusIcon(project.status)}
                                <span className="ml-1 capitalize">{project.status.replace("-", " ")}</span>
                              </Badge>
                              {getPaymentStatusBadge(project.paymentStatus)}
                            </div>
                            <div className="flex flex-col gap-2">
                              {project.status === 'active' && (
                                <>
                                  <Button 
                                    onClick={() => handleViewProposals(project)}
                                    className="bg-gradient-to-r from-[#5F4B8B] to-[#3700B3] hover:from-[#3700B3] hover:to-[#5F4B8B] text-white"
                                  >
                                    View Proposals ({project.applicants.length})
                                  </Button>
                                  {!project.featured && (
                                    <PaymentButton
                                      amount={299}
                                      projectId={project._id}
                                      type="featured_listing"
                                      clientId={user?.uid || ''}
                                      metadata={{
                                        name: userData?.name,
                                        email: user?.email,
                                        projectTitle: project.title
                                      }}
                                      onSuccess={() => {
                                        toast.success('Project featured successfully!');
                                        router.refresh();
                                      }}
                                      buttonText="Feature Project"
                                      buttonClassName="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-orange-500 hover:to-yellow-500 text-white"
                                    />
                                  )}
                                </>
                              )}
                              {project.status === 'in-progress' && project.paymentStatus === 'paid' && (
                                <Button 
                                  onClick={() => handleReleaseEscrow(project)}
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-emerald-500 hover:to-green-500 text-white"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Release Payment
                                </Button>
                              )}
                              <Button variant="outline" className="border-[#5F4B8B] text-[#5F4B8B] hover:bg-[#5F4B8B]/10">
                                Manage Project
                              </Button>
                              <Button variant="outline" className="border-[#3700B3] text-[#3700B3] hover:bg-[#3700B3]/10">
                                Messages
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Find Talent Tab - remains the same */}
            <TabsContent value="freelancers" className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F5F5F7]">
                  Find Indian Talent
                </h2>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8E8E93]" />
                    <Input
                      placeholder="Search freelancers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 bg-white/80 dark:bg-[#1A1A2E]/80 border-[#5F4B8B]/20 dark:border-[#1DE9B6]/30 rounded-xl"
                    />
                  </div>

                  <Button
                    variant="outline"
                    className="border-[#5F4B8B]/20 dark:border-[#1DE9B6]/30 text-[#5F4B8B] dark:text-[#1DE9B6] hover:bg-[#5F4B8B]/5 dark:hover:bg-[#1DE9B6]/5 bg-transparent rounded-xl"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-6">
                {["all", "web-dev", "mobile-dev", "design", "content", "marketing"].map(
                  (category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={
                        selectedCategory === category
                          ? "bg-gradient-to-r from-[#5F4B8B] to-[#3700B3] text-white border-0"
                          : "border-[#5F4B8B]/20 dark:border-[#1DE9B6]/30 text-[#5F4B8B] dark:text-[#1DE9B6] hover:bg-[#5F4B8B]/5 dark:hover:bg-[#1DE9B6]/5 bg-transparent"
                      }
                    >
                      {category === "all"
                        ? "All Categories"
                        : category
                            .split("-")
                            .map(
                              (word) => word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                    </Button>
                  )
                )}
              </div>

              {/* Freelancers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {freelancers.length === 0 ? (
                  <Card className="col-span-full border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg">
                    <CardContent className="py-12 text-center">
                      <Users className="h-16 w-16 text-[#8E8E93]/50 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-[#1C1C1E] dark:text-[#F5F5F7] mb-2">
                        No freelancers found
                      </h3>
                      <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80">
                        Try adjusting your search or filters
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  freelancers.map((freelancer) => (
                    <Card
                      key={freelancer._id}
                      className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <CardContent className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={freelancer.avatar} />
                              <AvatarFallback className="bg-gradient-to-r from-[#5F4B8B] to-[#3700B3] text-white">
                                {freelancer.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-[#1C1C1E] dark:text-[#F5F5F7]">
                                {freelancer.name}
                              </h3>
                              <p className="text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80">
                                {freelancer.role}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            {getAvailabilityBadge(freelancer.availability)}
                            {freelancer.profileBoost?.active && (
                              <Badge className="bg-gradient-to-r from-[#5F4B8B] to-[#1DE9B6] text-white border-0">
                                <Zap className="h-3 w-3 mr-1" />
                                Boosted
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(freelancer.rating)
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-[#1C1C1E] dark:text-[#F5F5F7]">
                            {freelancer.rating.toFixed(1)}
                          </span>
                        </div>

                        {/* Bio */}
                        <p className="text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80 mb-4 line-clamp-2">
                          {freelancer.bio}
                        </p>

                        {/* Stats */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#8E8E93] dark:text-[#F5F5F7]/80">
                              Hourly Rate
                            </span>
                            <span className="font-semibold text-[#5F4B8B] dark:text-[#1DE9B6]">
                              ₹{freelancer.hourlyRate}/hr
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#8E8E93] dark:text-[#F5F5F7]/80">
                              Completed
                            </span>
                            <span className="font-medium text-[#1C1C1E] dark:text-[#F5F5F7]">
                              {freelancer.completedProjects} projects
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#8E8E93] dark:text-[#F5F5F7]/80">
                              Response Time
                            </span>
                            <span className="font-medium text-[#1C1C1E] dark:text-[#F5F5F7]">
                              {freelancer.responseTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-[#8E8E93]" />
                            <span className="text-[#8E8E93] dark:text-[#F5F5F7]/80">
                              {freelancer.location}
                            </span>
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {freelancer.skills.slice(0, 3).map((skill) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="bg-[#5F4B8B]/10 text-[#5F4B8B] dark:bg-[#1DE9B6]/10 dark:text-[#1DE9B6] border-0 text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {freelancer.skills.length > 3 && (
                            <Badge
                              variant="secondary"
                              className="bg-[#8E8E93]/10 text-[#8E8E93] border-0 text-xs"
                            >
                              +{freelancer.skills.length - 3}
                            </Badge>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 border-[#5F4B8B]/20 dark:border-[#1DE9B6]/30 text-[#5F4B8B] dark:text-[#1DE9B6] hover:bg-[#5F4B8B]/5 dark:hover:bg-[#1DE9B6]/5 bg-transparent"
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Message
                          </Button>
                          <Button className="flex-1 bg-gradient-to-r from-[#5F4B8B] to-[#3700B3] hover:from-[#3700B3] hover:to-[#5F4B8B] text-white">
                            Hire Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-6">
              <Card className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg">
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-16 w-16 text-[#8E8E93]/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#1C1C1E] dark:text-[#F5F5F7] mb-2">
                    Messages coming soon
                  </h3>
                  <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80">
                    Direct messaging with freelancers will be available soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Post Project Modal */}
      {showPostModal && (
        <PostProjectModal
          isOpen={showPostModal}
          onClose={() => setShowPostModal(false)}
          onSubmit={handlePostProject}
        />
      )}

      {/* View Applications Modal */}
      <Dialog open={showApplicationsModal} onOpenChange={setShowApplicationsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Applications for {selectedProject?.title}</DialogTitle>
            <DialogDescription>
              Review and manage applications from freelancers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {projectApplications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-[#8E8E93]/50 mx-auto mb-3" />
                <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80">No applications yet</p>
              </div>
            ) : (
              projectApplications.map((application) => (
                <Card key={application._id} className="border-[#5F4B8B]/10 dark:border-[#1DE9B6]/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={application.studentAvatar} />
                          <AvatarFallback className="bg-gradient-to-r from-[#5F4B8B] to-[#3700B3] text-white">
                            {application.studentName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-[#1C1C1E] dark:text-[#F5F5F7]">
                            {application.studentName}
                          </h4>
                          <p className="text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80">
                            Applied {getTimeAgo(application.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-[#5F4B8B] dark:text-[#1DE9B6]">
                          ₹{application.bidAmount.toLocaleString('en-IN')}
                        </span>
                        {application.status === 'accepted' && !application.paid && (
                          <Badge className="bg-yellow-500 text-white border-0">
                            Payment Pending
                          </Badge>
                        )}
                        {application.paid && (
                          <Badge className="bg-green-500 text-white border-0">
                            Paid
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <h5 className="font-medium text-sm text-[#1C1C1E] dark:text-[#F5F5F7] mb-1">
                        Proposal
                      </h5>
                      <p className="text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80">
                        {application.proposal}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80">
                        Duration: {application.estimatedDuration}
                      </span>
                      <div className="flex gap-2">
                        {application.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptApplication(application)}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-emerald-500 hover:to-green-500 text-white"
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Accept
                            </Button>
                          </>
                        )}
                        {application.status === 'accepted' && !application.paid && (
                          <PaymentButton
                            amount={application.bidAmount}
                            projectId={selectedProject?._id || ''}
                            applicationId={application._id}
                            type="project_payment"
                                                     clientId={user?.uid || ''}
                            studentId={application.studentId}
                            metadata={{
                              name: userData?.name,
                              email: user?.email,
                              projectTitle: selectedProject?.title,
                              applicationId: application._id
                            }}
                            onSuccess={handlePaymentSuccess}
                            buttonText={`Pay ₹${application.bidAmount.toLocaleString('en-IN')}`}
                            buttonClassName="bg-gradient-to-r from-[#5F4B8B] to-[#3700B3] hover:from-[#3700B3] hover:to-[#5F4B8B] text-white"
                          />
                        )}
                        {application.paid && (
                          <Button
                            size="sm"
                            disabled
                            className="bg-gray-400 text-white"
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Hired & Paid
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApplicationsModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Dialog */}
      <Dialog open={showPaymentConfirm} onOpenChange={setShowPaymentConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Proceed with Payment</DialogTitle>
            <DialogDescription>
              You've accepted {selectedApplication?.studentName}'s application. Proceed with payment to hire them.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-[#F3F0FF]/50 dark:bg-[#1A1A2E]/50 rounded-lg p-4">
              <h4 className="font-semibold text-[#1C1C1E] dark:text-[#F5F5F7] mb-2">
                Payment Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#8E8E93] dark:text-[#F5F5F7]/80">Amount</span>
                  <span className="font-medium">₹{selectedApplication?.bidAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E8E93] dark:text-[#F5F5F7]/80">Duration</span>
                  <span className="font-medium">{selectedApplication?.estimatedDuration}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 dark:text-green-100">
                    Escrow Protection
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Your payment will be held securely until you approve the completed work.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPaymentConfirm(false)
                setSelectedApplication(null)
              }}
            >
              Cancel
            </Button>
            {selectedApplication && selectedProject && (
              <PaymentButton
                amount={selectedApplication.bidAmount}
                projectId={selectedProject._id}
                applicationId={selectedApplication._id}
                type="project_payment"
                clientId={user?.uid || ''}
                studentId={selectedApplication.studentId}
                metadata={{
                  name: userData?.name,
                  email: user?.email,
                  projectTitle: selectedProject.title,
                  applicationId: selectedApplication._id
                }}
                onSuccess={handlePaymentSuccess}
                buttonText="Proceed to Payment"
              />
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}