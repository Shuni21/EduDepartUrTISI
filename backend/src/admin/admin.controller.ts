import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';

import { Request } from 'express';



import { AccessTokenGuard } from '../auth/guards/access-token.guard';

import { AdminGuard } from './guards/admin.guard';

import { AdminService } from './admin.service';
import { AdminAcademicService } from './admin-academic.service';

import { parseCreateUserBody, parseUpdateUserBody } from './dto/user-body.parser';

import { SetDepartmentHeadDto } from './dto/set-department-head.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateTeacherDepartmentDto } from './dto/create-teacher-department.dto';
import { CreateStaffDepartmentDto } from './dto/create-staff-department.dto';



interface AuthenticatedRequest extends Request {

    user: {

        sub: number;

        login: string;

    };

}



@Controller('admin')

@UseGuards(AccessTokenGuard, AdminGuard)

export class AdminController {

    constructor(

        private readonly adminService: AdminService,

        private readonly adminAcademicService: AdminAcademicService,

    ) {}



    @Get('users')

    listUsers() {

        return this.adminService.listUsers();

    }



    @Post('users')
    createUser(@Body() body: Record<string, unknown>) {
        const dto = parseCreateUserBody(body);

        return this.adminService.createUser(dto);

    }



    @Get('users/:id')

    getUser(@Param('id', ParseIntPipe) id: number) {

        return this.adminService.getUser(id);

    }



    @Patch('users/:id')
    updateUser(
        @Param('id', ParseIntPipe) id: number,

        @Body() body: Record<string, unknown>,

        @Req() req: AuthenticatedRequest,

    ) {

        const dto = parseUpdateUserBody(body);



        return this.adminService.updateUser(id, dto, req.user.sub);

    }



    @Delete('users/:id')

    deleteUser(

        @Param('id', ParseIntPipe) id: number,

        @Req() req: AuthenticatedRequest,

    ) {

        return this.adminService.deleteUser(id, req.user.sub);

    }



    @Get('sessions')

    listSessions() {

        return this.adminService.listActiveSessions();

    }



    @Delete('sessions/:id')

    revokeSession(@Param('id', ParseIntPipe) id: number) {

        return this.adminService.revokeSession(id);

    }



    @Get('academic/overview')

    getAcademicOverview() {

        return this.adminAcademicService.getOverview();

    }



    @Post('academic/groups')
    createAcademicGroup(@Body() dto: CreateGroupDto) {
        return this.adminAcademicService.createGroup(dto);
    }



    @Post('academic/departments/teacher')

    createTeacherDepartment(@Body() dto: CreateTeacherDepartmentDto) {

        return this.adminAcademicService.createTeacherDepartment(dto);

    }



    @Post('academic/departments/staff')

    createStaffDepartment(@Body() dto: CreateStaffDepartmentDto) {

        return this.adminAcademicService.createStaffDepartment(dto);

    }



    @Patch('academic/departments/:id/head')

    setDepartmentHead(

        @Param('id', ParseIntPipe) id: number,

        @Body() dto: SetDepartmentHeadDto,

    ) {

        return this.adminAcademicService.setDepartmentHead(

            id,

            dto.headUserId ?? null,

        );

    }



    @Delete('academic/groups/:id')

    deleteAcademicGroup(@Param('id', ParseIntPipe) id: number) {

        return this.adminAcademicService.deleteGroup(id);

    }



    @Delete('academic/departments/:id')

    deleteAcademicDepartment(@Param('id', ParseIntPipe) id: number) {

        return this.adminAcademicService.deleteDepartment(id);

    }



    @Get('academic/departments/staff')

    listStaffDepartments() {

        return this.adminService.listStaffDepartments();

    }



}
