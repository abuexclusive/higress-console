import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Form, Input, Select, Checkbox } from 'antd';
import FactorGroup from '../FactorGroup';
import { getGatewayServices, getGatewayDomain } from '@/services';
import { useRequest } from 'ahooks';
import { OptionItem } from '@/interfaces/service';
import { DomainResponse } from '@/interfaces/domain';
import { uniqueId } from "lodash";

const { Option } = Select;
const MethodOptions = [
  { label: "GET", value: "GET" },
  { label: "POST", value: "POST" },
  { label: "PUT", value: "PUT" },
  { label: "DELETE", value: "DELETE" },
  { label: "OPTIONS", value: "OPTIONS" },
  { label: "HEAD", value: "HEAD" },
  { label: "PATCH", value: "PATCH" },
  { label: "TRACE", value: "TRACE" },
  { label: "CONNECT", value: "CONNECT" },
];

const RouteForm: React.FC = forwardRef((props, ref) => {

  const { value } = props;
  const [form] = Form.useForm();
  const [serviceOptions, setServiceOptions] = useState<OptionItem[]>([]);
  const [domainOptions, setDomainOptions] = useState<OptionItem[]>([]);
  const servicesRef = useRef(new Map());
  const { data: _services = [] } = useRequest(getGatewayServices);
  const { data: _response = { list: [] } } = useRequest(getGatewayDomain);

  useEffect(() => {
    form.resetFields();
    const _serviceOptions: OptionItem[] = [];
    _services && _services.forEach(service => {
      const { name } = service;
      _serviceOptions.push({ label: name, value: name });
      servicesRef.current.set(name, service);
    });
    setServiceOptions(_serviceOptions);
    const _domainOptions: OptionItem[] = [];
    const { list: _domain } = _response as DomainResponse;
    _domain && _domain.forEach(domain => {
      const { name } = domain;
      _domainOptions.push({ label: name, value: name });
    });
    setDomainOptions(_domainOptions);

    if (value) {
      const { name, domainList, routePredicates, services } = value;
      const { pathPredicates, methodPredicates, headerPredicates, queryPredicates } = routePredicates;
      const { type, path, ignoreCase } = pathPredicates;
      const [service] = services;
      const { name: _name } = service;
      const _headerPredicates = headerPredicates && headerPredicates.map((header) => {
        return { ...header, uid: uniqueId() };
      });
      const _queryPredicates = queryPredicates && queryPredicates.map((query) => {
        return { ...query, uid: uniqueId() };
      });
      form.setFieldsValue({ 
        name, 
        domainList,
        pathPredicates: { type, path, ignoreCase: ignoreCase ? [] : ['ignore'] },
        methodPredicates,
        headerPredicates: _headerPredicates,
        queryPredicates: _queryPredicates,
        services: _name,
      });
    }
  }, [_services, _response, value]);

  useImperativeHandle(ref, () => ({
    reset: () => form.resetFields(),
    handleSubmit: () => (form.validateFields()),
  }));

  return (
    <Form
      form={form}
      layout="vertical"
    >
      <Form.Item 
        label="路由名称" 
        required 
        name='name' 
        tooltip="推荐结合业务场景命名，例如user-default、user-gray等"
        rules={[
          {
            required: true,
            message: '包含小写字母、数字和以及特殊字符(- .)，且不能以特殊字符开头和结尾',
          },
        ]}
      >
        <Input
          showCount
          allowClear
          disabled={value}
          maxLength={63} 
          placeholder="包含小写字母、数字和以及特殊字符(- .)，且不能以特殊字符开头和结尾" 
        />
      </Form.Item>
      <Form.Item 
        label="域名" 
        required 
        name='domainList'
        rules={[
          { 
            required: true, 
            message: '请选择域名' 
          }
        ]}
      >
        <Select
          showSearch
          allowClear
          mode="multiple"
          placeholder="搜索域名名称域名"
          options={domainOptions}
        />
      </Form.Item>
      <Form.Item 
        label="匹配规则" 
        required 
        tooltip="规则之间是“与”关系，即填写的规则越多匹配的范围越小"
      >
        <Form.Item label="路径（Path）" required>
          <Input.Group compact>
            <Form.Item
              name={['pathPredicates', 'type']}
              noStyle
              rules={[
                { 
                  required: true, 
                  message: '请选择路径匹配规则' 
                }
              ]}
            >
              <Select 
                style={{ width: '20%' }}
                placeholder="匹配规则"
              >
                <Option value="PRE">前缀匹配</Option>
                <Option value="EQUAL">精确匹配</Option>
                <Option value="ERGULAR">正则匹配</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name={['pathPredicates', 'path']}
              noStyle
              rules={[
                { 
                  required: true, 
                  message: '请输入路径匹配值' 
                }
              ]}
            >
              <Input style={{ width: '60%' }} placeholder="路径匹配值，如：/user" />
            </Form.Item>
            <Form.Item
              name={['pathPredicates', 'ignoreCase']}
              noStyle
            >
              <Checkbox.Group 
                options={[
                  {
                    label: '大小写敏感', value: 'ignore'
                  }
                ]}
                style={{ width: '18%', display: 'inline-flex', marginLeft: 12, marginTop: 4 }}
              />
            </Form.Item>
          </Input.Group>
        </Form.Item>
        <Form.Item 
          label="方法（Method）" 
          name='methodPredicates'
        >
          <Select
            mode="multiple"
            allowClear
            style={{ width: '100%' }}
            placeholder="方法匹配值，可多选，不填则匹配所以的HTTP方法"
            options={MethodOptions}
          />
        </Form.Item>
        <Form.Item 
          label="请求头（Header）" 
          name='headerPredicates' 
          tooltip="多个参数之间是“与”关系"
        >
          <FactorGroup />
        </Form.Item>
        <Form.Item 
          label="请求参数（Query）" 
          name='queryPredicates' 
          tooltip="多个参数之间是“与”关系"
        >
          <FactorGroup />
        </Form.Item>
        <Form.Item 
          label="目标服务" 
          required 
          name='services'
          rules={[
            { 
              required: true, 
              message: '请选择目标服务' 
            }
          ]}
        >
          <Select
            showSearch
            allowClear
            placeholder="搜索服务名称选择服务"
            options={serviceOptions}
          />
        </Form.Item>
      </Form.Item>
    </Form>
  );
});

export default RouteForm;
