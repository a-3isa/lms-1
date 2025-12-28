FROM rabbitmq:3-management-alpine

# Enable management plugin (for web UI at port 15672)
RUN rabbitmq-plugins enable rabbitmq_management


# Expose ports: 5672 for AMQP, 15672 for management UI
EXPOSE 5672 15672