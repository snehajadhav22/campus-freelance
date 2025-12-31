// app/dashboard/student/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Star,
  DollarSign,
  Clock,
  TrendingUp,
  Award,
  Eye,
  MessageSquare,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  ExternalLink,
  Search,
  Filter,
  Briefcase,
  Send,
  MapPin,
  Users,
  ChevronRight,
  Loader2,
  FileText,
  Target,
  Zap,
  Shield,
  Wallet,
  CreditCard,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { EarningsCard } from "@/components/payment/EarningsCard"
import { ProfileBoostCard } from "@/components/ProfileBoostCard"
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
  clientId: string
  clientName?: string
  applicants: string[]
  proposals: number
  views: number
  featured?: boolean
  featuredUntil?: string
  createdAt: string
  updatedAt: string
}

interface Application {
  _id: string
  projectId: Project
  studentId: string
  proposal: string
  bidAmount: number
  estimatedDuration: string
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'hired'
  paid?: boolean
  paymentId?: string
  createdAt: string
  updatedAt: string
}

interface StudentStats {
  totalEarnings: number
  availableBalance: number
  pendingEarnings: number
  activeProjects: number
  completedProjects: number
  profileViews: number
  totalApplications: number
  acceptanceRate: number
  avgResponseTime: string
  rating: number
  totalReviews: number
  thisMonthEarnings: number
  lastMonthEarnings: number
}

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [availableProjects, setAvailableProjects] = useState<Project[]>([])
  const [myApplications, setMyApplications] = useState<Application[]>([])
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedBudget, setSelectedBudget] = useState("all")
  const [selectedDuration, setSelectedDuration] = useState("all")
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [applyForm, setApplyForm] = useState({
    proposal: "",
    bidAmount: "",
    estimatedDuration: "",
  })
  const [applyLoading, setApplyLoading] = useState(false)
  
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
          
          // Fetch student stats with earnings
          const statsRes = await fetch(`/api/dashboard/student/stats?studentId=${user.uid}`)
          const statsData = await statsRes.json()
          if (statsData.success) {
            setStats(statsData.data)
          }
          
          // Fetch available projects
          const projectsRes = await fetch('/api/projects/available')
          const projectsData = await projectsRes.json()
          if (projectsData.success) {
            setAvailableProjects(projectsData.data)
          }
          
          // Fetch my applications
          const applicationsRes = await fetch(`/api/applications?studentId=${user.uid}`)
          const applicationsData = await applicationsRes.json()
          if (applicationsData.success) {
            setMyApplications(applicationsData.data)
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

  // Search and filter projects
  const handleProjectSearch = async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (selectedBudget !== 'all') params.append('budget', selectedBudget)
      if (selectedDuration !== 'all') params.append('duration', selectedDuration)
      
      const response = await fetch(`/api/projects/available?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setAvailableProjects(data.data)
      }
    } catch (error) {
      console.error('Error searching projects:', error)
      toast.error('Failed to search projects')
    }
  }

  // Trigger search when filters change
  useEffect(() => {
    if (activeTab === 'browse-projects') {
      handleProjectSearch()
    }
  }, [searchQuery, selectedCategory, selectedBudget, selectedDuration, activeTab])

  // Track project view
  const handleProjectView = async (projectId: string) => {
    try {
      await fetch(`/api/projects/${projectId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewerId: user?.uid })
      })
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }

  // Handle apply to project
  const handleApplyToProject = async () => {
    if (!selectedProject || !applyForm.proposal || !applyForm.bidAmount || !applyForm.estimatedDuration) {
      toast.error('Please fill all fields')
      return
    }

    try {
      setApplyLoading(true)
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: selectedProject._id,
          studentId: user?.uid,
          studentName: userData?.name || 'Unknown',
          studentAvatar: userData?.avatar || user?.photoURL,
          proposal: applyForm.proposal,
          bidAmount: parseFloat(applyForm.bidAmount),
          estimatedDuration: applyForm.estimatedDuration,
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Application submitted successfully!')
        setShowApplyModal(false)
        setApplyForm({ proposal: "", bidAmount: "", estimatedDuration: "" })
        // Refresh applications
        const applicationsRes = await fetch(`/api/applications?studentId=${user.uid}`)
        const applicationsData = await applicationsRes.json()
        if (applicationsData.success) {
          setMyApplications(applicationsData.data)
        }
      } else {
        toast.error(result.message || 'Failed to submit application')
      }
    } catch (error) {
      console.error('Error applying to project:', error)
      toast.error('Failed to submit application')
    } finally {
      setApplyLoading(false)
    }
  }

  const getUserInitials = () => {
    if (userData?.name) {
      return userData.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    }
    return "U"
  }

  const getGreeting = () => {
    const name = userData?.name?.split(' ')[0] || 'there'
    return `Welcome back, ${name}! 🙏`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "in-progress":
        return "bg-blue-500"
      case "review":
        return "bg-yellow-500"
      case "active":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "accepted":
        return "bg-green-500"
      case "rejected":
        return "bg-red-500"
      case "hired":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "in-progress":
        return <Clock className="h-4 w-4" />
      case "review":
        return <AlertCircle className="h-4 w-4" />
      case "accepted":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <AlertCircle className="h-4 w-4" />
      case "hired":
        return <Briefcase className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
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

  const hasAppliedToProject = (projectId: string) => {
    return myApplications.some(app => app.projectId._id === projectId)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5F4B8B]" />
      </div>
    )
  }

  const hasProfileBoost = userData?.profileBoost?.active && 
    new Date(userData.profileBoost.expiresAt) > new Date()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F0FF] via-white to-[#FAFAFC] dark:from-[#1A1A2E] dark:via-[#16213E] dark:to-[#1A1A2E]">
      <Navbar onAuthClick={() => {}} isAuthenticated={true} userType="student" />
      
      <div className="pt-20 px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-4 border-[#5F4B8B]/20 dark:border-[#1DE9B6]/30">
                  <AvatarImage src={userData?.avatar || user?.photoURL || undefined} />
                  <AvatarFallback className="bg-gradient-to-r from-[#5F4B8B] to-[#1DE9B6] text-white text-2xl">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold text-[#1C1C1E] dark:text-[#F5F5F7] mb-2">
                    {getGreeting()}
                  </h1>
                  <div className="flex items-center gap-4 text-[#8E8E93] dark:text-[#F5F5F7]/80">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-[#1DE9B6] text-[#1DE9B6]" />
                      <span className="font-semibold">{stats?.rating?.toFixed(1) || '0.0'}</span>
                      <span>({stats?.totalReviews || 0} reviews)</span>
                    </div>
                    {stats?.rating && stats.rating >= 4.5 && (
                      <Badge className="bg-[#1DE9B6]/10 text-[#1DE9B6] border-[#1DE9B6]/20">Top Rated 🏆</Badge>
                    )}
                    {hasProfileBoost && (
                      <Badge className="bg-gradient-to-r from-[#5F4B8B] to-[#1DE9B6] text-white border-0">
                        <Zap className="h-3 w-3 mr-1" />
                        Profile Boosted
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button className="bg-gradient-to-r from-[#5F4B8B] to-[#3700B3] hover:from-[#3700B3] hover:to-[#5F4B8B] text-white rounded-2xl px-6 shadow-lg hover:shadow-xl transition-all duration-300">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
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
                value="browse-projects"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#5F4B8B] data-[state=active]:to-[#3700B3] data-[state=active]:text-white"
              >
                Browse Projects
              </TabsTrigger>
              <TabsTrigger
                value="my-applications"
                className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#5F4B8B] data-[state=active]:to-[#3700B3] data-[state=active]:text-white"
              >
                My Applications
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
                        <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80 text-sm font-medium">Total Earnings</p>
                        <p className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F5F5F7]">
                          ₹{stats?.totalEarnings?.toLocaleString('en-IN') || '0'}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-[#5F4B8B] to-[#1DE9B6] rounded-xl flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {stats?.thisMonthEarnings && stats?.lastMonthEarnings ? (
                        stats.thisMonthEarnings > stats.lastMonthEarnings ? (
                          <>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-500 font-medium">
                              +{((stats.thisMonthEarnings - stats.lastMonthEarnings) / stats.lastMonthEarnings * 100).toFixed(0)}% from last month
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80">
                            ₹{stats.availableBalance?.toLocaleString('en-IN') || '0'} available
                          </span>
                        )
                      ) : (
                        <span className="text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80">
                          ₹{stats?.availableBalance?.toLocaleString('en-IN') || '0'} available
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80 text-sm font-medium">Active Projects</p>
                        <p className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F5F5F7]">
                          {stats?.activeProjects || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80">
                        ₹{stats?.pendingEarnings?.toLocaleString('en-IN') || '0'} pending
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80 text-sm font-medium">Completed</p>
                        <p className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F5F5F7]">
                          {stats?.completedProjects || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-sm text-green-500 font-medium">
                        {stats?.acceptanceRate ? `${(stats.acceptanceRate * 100).toFixed(0)}% acceptance rate` : '0% acceptance rate'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80 text-sm font-medium">Profile Views</p>
                        <p className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F5F5F7]">
                          {stats?.profileViews || 0}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                        <Eye className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80">Last 30 days</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Earnings Card */}
                <div className="lg:col-span-2">
                  <EarningsCard userId={user?.uid || ''} />
                </div>

                {/* Quick Stats & Actions */}
                <div className="space-y-6">
                  {/* Profile Boost Card */}
                  {!hasProfileBoost && (
                    <ProfileBoostCard 
                      userId={user?.uid || ''}
                      userEmail={user?.email || ''}
                      userName={userData?.name || 'User'}
                    />
                  )}

                  <Card className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-[#1C1C1E] dark:text-[#F5F5F7]">Profile Strength</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80">Profile Completion</span>
                          <span className="text-sm font-medium text-[#5F4B8B] dark:text-[#1DE9B6]">85%</span>
                        </div>
                        <Progress value={85} className="h-2 bg-[#5F4B8B]/10" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80">Complete your profile to:</p>
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-center gap-2 text-[#1C1C1E] dark:text-[#F5F5F7]">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Get 30% more visibility
                          </li>
                          <li className="flex items-center gap-2 text-[#1C1C1E] dark:text-[#F5F5F7]">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Increase acceptance rate
                          </li>
                          <li className="flex items-center gap-2 text-[#8E8E93] dark:text-[#F5F5F7]/80">
                            <div className="h-3 w-3 rounded-full border border-[#8E8E93]" />
                            Add portfolio items
                          </li>
                        </ul>
                      </div>
                      <Button 
                        className="w-full bg-gradient-to-r from-[#5F4B8B] to-[#3700B3] hover:from-[#3700B3] hover:to-[#5F4B8B] text-white"
                      >
                        Complete Profile
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-[#1C1C1E] dark:text-[#F5F5F7]">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        onClick={() => setActiveTab('browse-projects')}
                        className="w-full justify-start bg-gradient-to-r from-[#5F4B8B] to-[#3700B3] hover:from-[#3700B3] hover:to-[#5F4B8B] text-white rounded-xl"
                      >
                        <Search className="mr-2 h-4 w-4" />
                        Browse Projects
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start border-[#5F4B8B]/20 dark:border-[#1DE9B6]/30 text-[#5F4B8B] dark:text-[#1DE9B6] hover:bg-[#5F4B8B]/5 dark:hover:bg-[#1DE9B6]/5 rounded-xl bg-transparent"
                      >
                        <Award className="mr-2 h-4 w-4" />
                        View Certificates
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
                </div>
              </div>

                         {/* Recent Applications */}
              <Card className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="text-[#1C1C1E] dark:text-[#F5F5F7] flex items-center justify-between">
                    Recent Applications
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-[#5F4B8B] dark:text-[#1DE9B6]"
                      onClick={() => setActiveTab('my-applications')}
                    >
                      View All
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {myApplications.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-[#8E8E93]/50 mx-auto mb-3" />
                      <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80">No applications yet</p>
                      <Button 
                        onClick={() => setActiveTab('browse-projects')}
                        className="mt-4 bg-gradient-to-r from-[#5F4B8B] to-[#3700B3] text-white"
                      >
                        Browse Projects
                      </Button>
                    </div>
                  ) : (
                    myApplications.slice(0, 3).map((application) => (
                      <div
                        key={application._id}
                        className="p-4 rounded-xl bg-[#F3F0FF]/50 dark:bg-[#1A1A2E]/50 border border-[#5F4B8B]/10 dark:border-[#1DE9B6]/20"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-[#1C1C1E] dark:text-[#F5F5F7] mb-1">
                              {application.projectId.title}
                            </h3>
                            <p className="text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80 mb-2 line-clamp-2">
                              {application.proposal}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            <Badge className={`${getStatusColor(application.status)} text-white border-0`}>
                              {getStatusIcon(application.status)}
                              <span className="ml-1 capitalize">{application.status}</span>
                            </Badge>
                            {application.status === 'hired' && application.paid && (
                              <Badge className="bg-green-500 text-white border-0">
                                <CreditCard className="h-3 w-3 mr-1" />
                                Paid
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-[#5F4B8B] dark:text-[#1DE9B6]">
                            ₹{application.bidAmount.toLocaleString('en-IN')}
                          </span>
                          <div className="flex items-center gap-4 text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80">
                            <span>{application.estimatedDuration}</span>
                            <span>•</span>
                            <span>Applied {getTimeAgo(application.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Browse Projects Tab */}
            <TabsContent value="browse-projects" className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F5F5F7]">
                  Browse Available Projects
                </h2>

                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8E8E93]" />
                    <Input
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 bg-white/80 dark:bg-[#1A1A2E]/80 border-[#5F4B8B]/20 dark:border-[#1DE9B6]/30 rounded-xl"
                    />
                  </div>

                  {/* Filter Button */}
                  <Button
                    variant="outline"
                    className="border-[#5F4B8B]/20 dark:border-[#1DE9B6]/30 text-[#5F4B8B] dark:text-[#1DE9B6] hover:bg-[#5F4B8B]/5 dark:hover:bg-[#1DE9B6]/5 bg-transparent rounded-xl"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </div>
              </div>

              {/* Filter Options */}
              <div className="flex flex-wrap gap-4 mb-6">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px] bg-white/80 dark:bg-[#1A1A2E]/80 border-[#5F4B8B]/20 dark:border-[#1DE9B6]/30">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="web-dev">Web Development</SelectItem>
                    <SelectItem value="mobile-dev">Mobile Development</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="content">Content Writing</SelectItem>
                    <SelectItem value="marketing">Digital Marketing</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                  <SelectTrigger className="w-[180px] bg-white/80 dark:bg-[#1A1A2E]/80 border-[#5F4B8B]/20 dark:border-[#1DE9B6]/30">
                    <SelectValue placeholder="Budget Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Budget</SelectItem>
                    <SelectItem value="0-10000">₹0 - ₹10,000</SelectItem>
                    <SelectItem value="10000-50000">₹10,000 - ₹50,000</SelectItem>
                    <SelectItem value="50000-100000">₹50,000 - ₹1,00,000</SelectItem>
                    <SelectItem value="100000+">₹1,00,000+</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                  <SelectTrigger className="w-[180px] bg-white/80 dark:bg-[#1A1A2E]/80 border-[#5F4B8B]/20 dark:border-[#1DE9B6]/30">
                    <SelectValue placeholder="Duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Duration</SelectItem>
                    <SelectItem value="less-than-week">Less than a week</SelectItem>
                    <SelectItem value="1-4-weeks">1-4 weeks</SelectItem>
                    <SelectItem value="1-3-months">1-3 months</SelectItem>
                    <SelectItem value="3-6-months">3-6 months</SelectItem>
                    <SelectItem value="6-months+">6+ months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Projects Grid */}
              {availableProjects.length === 0 ? (
                <Card className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg">
                  <CardContent className="py-12 text-center">
                    <Briefcase className="h-16 w-16 text-[#8E8E93]/50 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#1C1C1E] dark:text-[#F5F5F7] mb-2">
                      No projects found
                    </h3>
                    <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80">
                      Try adjusting your search or filters
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {availableProjects.map((project) => (
                    <Card
                      key={project._id}
                      className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                      onClick={() => handleProjectView(project._id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          {/* Left side - project details */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
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
                            <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80 mb-3 line-clamp-3">
                              {project.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80 mb-4">
                              <span className="font-semibold text-[#5F4B8B] dark:text-[#1DE9B6] text-lg">
                                {formatBudget(project.budget)}
                              </span>
                              <span>•</span>
                              <span>Duration: {project.duration}</span>
                              <span>•</span>
                              <span>Posted {getTimeAgo(project.createdAt)}</span>
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
                              {project.clientName && (
                                <div className="flex items-center gap-1 text-[#8E8E93] dark:text-[#F5F5F7]/80">
                                  <Briefcase className="h-4 w-4" />
                                  <span>{project.clientName}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right side - actions */}
                          <div className="flex flex-col gap-3 lg:ml-6">
                            <Badge className={`${getStatusColor(project.status)} text-white border-0 hidden lg:flex w-fit`}>
                              {getStatusIcon(project.status)}
                              <span className="ml-1 capitalize">{project.status.replace("-", " ")}</span>
                            </Badge>
                            {hasAppliedToProject(project._id) ? (
                              <Button disabled className="bg-gray-400 text-white">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Already Applied
                              </Button>
                            ) : (
                              <Button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedProject(project)
                                  setShowApplyModal(true)
                                }}
                                className="bg-gradient-to-r from-[#5F4B8B] to-[#3700B3] hover:from-[#3700B3] hover:to-[#5F4B8B] text-white"
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Apply Now
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              className="border-[#5F4B8B] text-[#5F4B8B] hover:bg-[#5F4B8B]/10"
                              onClick={(e) => {
                                e.stopPropagation()
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* My Applications Tab */}
            <TabsContent value="my-applications" className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F5F5F7]">
                  My Applications ({myApplications.length})
                </h2>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px] bg-white/80 dark:bg-[#1A1A2E]/80 border-[#5F4B8B]/20 dark:border-[#1DE9B6]/30">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Applications</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {myApplications.length === 0 ? (
                <Card className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg">
                  <CardContent className="py-12 text-center">
                    <FileText className="h-16 w-16 text-[#8E8E93]/50 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#1C1C1E] dark:text-[#F5F5F7] mb-2">
                      No applications yet
                    </h3>
                    <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80 mb-6">
                      Start applying to projects to see them here
                    </p>
                    <Button 
                      onClick={() => setActiveTab('browse-projects')}
                      className="bg-gradient-to-r from-[#5F4B8B] to-[#3700B3] text-white"
                    >
                      Browse Projects
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {myApplications.map((application) => (
                    <Card
                      key={application._id}
                      className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          {/* Left side - application details */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-xl font-bold text-[#1C1C1E] dark:text-[#F5F5F7] mb-1">
                                  {application.projectId.title}
                                </h3>
                                <p className="text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80">
                                  Applied {getTimeAgo(application.createdAt)}
                                </p>
                              </div>
                              <Badge className={`${getStatusColor(application.status)} text-white border-0 lg:hidden`}>
                                {getStatusIcon(application.status)}
                                <span className="ml-1 capitalize">{application.status}</span>
                              </Badge>
                            </div>
                            
                            <div className="mb-4">
                              <h4 className="font-semibold text-[#1C1C1E] dark:text-[#F5F5F7] mb-2">Your Proposal:</h4>
                              <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80 line-clamp-3">
                                {application.proposal}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80 mb-1">Your Bid</p>
                                <p className="text-lg font-bold text-[#5F4B8B] dark:text-[#1DE9B6]">
                                  ₹{application.bidAmount.toLocaleString('en-IN')}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80 mb-1">Project Budget</p>
                                <p className="text-lg font-semibold text-[#1C1C1E] dark:text-[#F5F5F7]">
                                  {formatBudget(application.projectId.budget)}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-[#8E8E93] dark:text-[#F5F5F7]/80 mb-1">Duration</p>
                                <p className="text-lg font-semibold text-[#1C1C1E] dark:text-[#F5F5F7]">
                                  {application.estimatedDuration}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {application.projectId.skills.map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="secondary"
                                  className="bg-[#5F4B8B]/10 text-[#5F4B8B] dark:bg-[#1DE9B6]/10 dark:text-[#1DE9B6] border-0"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Right side - status and actions */}
                          <div className="flex flex-col gap-3 lg:ml-6">
                            <div className="flex flex-col gap-2">
                              <Badge className={`${getStatusColor(application.status)} text-white border-0 hidden lg:flex w-fit`}>
                                {getStatusIcon(application.status)}
                                <span className="ml-1 capitalize">{application.status}</span>
                              </Badge>
                              {application.status === 'hired' && application.paid && (
                                <Badge className="bg-green-500 text-white border-0 w-fit">
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Payment Received
                                </Badge>
                              )}
                              {application.status === 'hired' && !application.paid && (
                                <Badge className="bg-yellow-500 text-white border-0 w-fit">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Payment Pending
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              {(application.status === 'accepted' || application.status === 'hired') && (
                                <>
                                  <Button className="bg-gradient-to-r from-[#5F4B8B] to-[#3700B3] hover:from-[#3700B3] hover:to-[#5F4B8B] text-white">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Message Client
                                  </Button>
                                  {application.paid && (
                                    <Button variant="outline" className="border-[#3700B3] text-[#3700B3] hover:bg-[#3700B3]/10">
                                      <FileText className="mr-2 h-4 w-4" />
                                      View Contract
                                    </Button>
                                  )}
                                </>
                              )}
                              {application.status === 'pending' && (
                                <>
                                  <Button variant="outline" className="border-[#5F4B8B] text-[#5F4B8B] hover:bg-[#5F4B8B]/10">
                                    Edit Proposal
                                  </Button>
                                  <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-500/10">
                                    Withdraw
                                  </Button>
                                </>
                              )}
                              <Button variant="outline" className="border-[#3700B3] text-[#3700B3] hover:bg-[#3700B3]/10">
                                View Project
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

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-6">
              <Card className="border-0 bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-sm shadow-lg">
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-16 w-16 text-[#8E8E93]/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#1C1C1E] dark:text-[#F5F5F7] mb-2">
                    Messages coming soon
                  </h3>
                  <p className="text-[#8E8E93] dark:text-[#F5F5F7]/80">
                    Direct messaging with clients will be available soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Apply to Project Modal */}
      <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
        <DialogContent className="bg-white dark:bg-[#1A1A2E] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#1C1C1E] dark:text-[#F5F5F7]">
              Apply to Project
            </DialogTitle>
            <DialogDescription className="text-[#8E8E93] dark:text-[#F5F5F7]/80">
              {selectedProject?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-2 block">
                Project Budget
              </label>
              <div className="p-3 bg-[#F3F0FF]/50 dark:bg-[#1A1A2E]/50 rounded-lg">
                <p className="font-semibold text-[#5F4B8B] dark:text-[#1DE9B6]">
                  {selectedProject && formatBudget(selectedProject.budget)}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-2 block">
                Your Bid Amount (₹) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                placeholder="Enter your bid amount"
                value={applyForm.bidAmount}
                onChange={(e) => setApplyForm({ ...applyForm, bidAmount: e.target.value })}
                className="bg-white/80 dark:bg-[#1A1A2E]/80 border-[#5F4B8B]/20 dark:border-[#1DE9B6]/30"
              />
              <div className="mt-1 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Platform fee (10%) will be deducted: ₹{applyForm.bidAmount ? (parseFloat(applyForm.bidAmount) * 0.1).toFixed(0) : '0'}
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                  You'll receive: ₹{applyForm.bidAmount ? (parseFloat(applyForm.bidAmount) * 0.9).toLocaleString('en-IN') : '0'}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-2 block">
                Estimated Duration <span className="text-red-500">*</span>
              </label>
              <Select
                value={applyForm.estimatedDuration}
                onValueChange={(value) => setApplyForm({ ...applyForm, estimatedDuration: value })}
              >
                <SelectTrigger className="bg-white/80 dark:bg-[#1A1A2E]/80 border-[#5F4B8B]/20 dark:border-[#1DE9B6]/30">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="less than a week">Less than a week</SelectItem>
                  <SelectItem value="1 week">1 week</SelectItem>
                  <SelectItem value="2 weeks">2 weeks</SelectItem>
                  <SelectItem value="3 weeks">3 weeks</SelectItem>
                  <SelectItem value="1 month">1 month</SelectItem>
                  <SelectItem value="2 months">2 months</SelectItem>
                  <SelectItem value="3 months">3 months</SelectItem>
                                    <SelectItem value="more than 3 months">More than 3 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-[#1C1C1E] dark:text-[#F5F5F7] mb-2 block">
                Cover Letter / Proposal <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Explain why you're the best fit for this project..."
                value={applyForm.proposal}
                onChange={(e) => setApplyForm({ ...applyForm, proposal: e.target.value })}
                className="min-h-[150px] bg-white/80 dark:bg-[#1A1A2E]/80 border-[#5F4B8B]/20 dark:border-[#1DE9B6]/30"
              />
              <p className="text-xs text-[#8E8E93] dark:text-[#F5F5F7]/80 mt-1">
                Tip: Mention relevant experience and how you'll approach the project
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 dark:text-green-100">
                    Payment Protection
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Your payment is protected by our escrow system. You'll receive payment only after client approval.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApplyModal(false)
                setApplyForm({ proposal: "", bidAmount: "", estimatedDuration: "" })
              }}
              className="border-[#5F4B8B]/20 dark:border-[#1DE9B6]/30 text-[#5F4B8B] dark:text-[#1DE9B6]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyToProject}
              disabled={applyLoading}
              className="bg-gradient-to-r from-[#5F4B8B] to-[#3700B3] hover:from-[#3700B3] hover:to-[#5F4B8B] text-white"
            >
              {applyLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}