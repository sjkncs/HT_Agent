package com.heytea.agent.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.heytea.agent.entity.Conversation;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ConversationMapper extends BaseMapper<Conversation> {
}
