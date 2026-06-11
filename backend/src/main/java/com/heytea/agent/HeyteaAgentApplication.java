package com.heytea.agent;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.heytea.agent.mapper")
public class HeyteaAgentApplication {
    public static void main(String[] args) {
        SpringApplication.run(HeyteaAgentApplication.class, args);
    }
}
