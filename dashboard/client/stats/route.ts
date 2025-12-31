// app/api/dashboard/client/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Project from "@/models/Project";
import Payment from "@/models/Payment";
import Application from "@/models/Application";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    
    if (!clientId) {
      return NextResponse.json(
        { success: false, message: "Client ID is required" },
        { status: 400 }
      );
    }

    // Get all projects
    const projects = await Project.find({ clientId });
    
    // Calculate stats
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;

    // Get payment data
    const payments = await Payment.find({ 
      clientId, 
      status: 'completed',
      type: 'project_payment'
    });
    
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const pendingPayments = await Payment.countDocuments({ 
      clientId, 
      status: { $in: ['created', 'pending'] }
    });

    // Get hired freelancers count
    const hiredApplications = await Application.countDocuments({
      projectId: { $in: projects.map(p => p._id) },
      status: 'hired',
      paid: true
    });

    // Calculate total spent (includes all payments)
    const allPayments = await Payment.find({ 
      clientId, 
      status: 'completed' 
    });
    const totalSpent = allPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate average response time
    const applications = await Application.find({
      projectId: { $in: projects.map(p => p._id) }
    }).populate('projectId');

    let totalResponseTime = 0;
    let responseCount = 0;

    applications.forEach(app => {
      const project = app.projectId as any;
      if (project && project.createdAt && app.createdAt) {
        const projectDate = new Date(project.createdAt);
        const applicationDate = new Date(app.createdAt);
        const diffInHours = (applicationDate.getTime() - projectDate.getTime()) / (1000 * 60 * 60);
        totalResponseTime += diffInHours;
        responseCount++;
      }
    });

    const avgResponseTime = responseCount > 0 
      ? `${Math.round(totalResponseTime / responseCount)}h`
      : '0h';

    return NextResponse.json({
      success: true,
      data: {
        activeProjects,
        totalProjects,
        completedProjects,
        totalSpent,
        totalPaid,
        pendingPayments,
        hiredFreelancers: hiredApplications,
        avgResponseTime
      }
    });

  } catch (error: any) {
    console.error('Error fetching client stats:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}