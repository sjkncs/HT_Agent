package com.heytea.agent.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.heytea.agent.entity.Message;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface MessageMapper extends BaseMapper<Message> {
}
