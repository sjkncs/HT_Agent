package com.heytea.agent.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.heytea.agent.entity.AuditLog;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AuditLogMapper extends BaseMapper<AuditLog> {
}
