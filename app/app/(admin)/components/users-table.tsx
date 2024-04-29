"use client";

import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { User } from "@prisma/client";
import {
  Space,
  Table,
  Tag,
  Input,
  Button,
  notification as notificationModule,
  Popconfirm,
  Checkbox,
  Modal,
  Form,
} from "antd";
import type { GetRef, TableColumnsType } from "antd";
import { LockOutlined } from "@ant-design/icons";
// import { headers } from 'next/headers'
import type { NotificationArgsProps } from "antd";

// import Highlighter from "react-highlight-words";
// 后期考虑删除该依赖
// type NotificationPlacement = NotificationArgsProps["placement"];

import type { SearchProps } from "antd/es/input/Search";

const { Search } = Input;

import { getCurrentTime } from "@/app/utils/custom";

interface UserInterface {
  users: User[];
  setUsers: Dispatch<SetStateAction<User[]>>;
  loading: Boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
}
interface SearchTextProps {
  searchText: string;
  setSearchText: Dispatch<SetStateAction<string>>;
}

type DataIndex = keyof User;
type InputRef = GetRef<typeof Input>;

function UserTableSearchInput({ users, setUsers, setLoading }: UserInterface) {
  const [searchText, setSearchText] = useState("");
  // 这里直接搜索，并获取数据不传递搜索的值给表格了。
  const onSearch: SearchProps["onSearch"] = (value, _e, info) => {
    setSearchText(value);
  };

  useEffect(() => {
    setLoading(true);
    const fetchUsers = async () => {
      try {
        const url = new URL("/api/admin/users", window.location.href);
        url.searchParams.append("search", searchText);
        console.log(url, "url");
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setUsers(data["results"]);
          setLoading(false);
        }
      } catch (e) {
        setLoading(false);
        console.log("fetch user error: ", e);
      }
    };

    fetchUsers();
    // console.log(users, "users1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  return (
    <Search
      placeholder="input search text"
      onSearch={onSearch}
      enterButton
      style={{ width: 304 }}
    />
  );
}

function UsersTable({ users, setUsers, loading }: UserInterface) {
  const [notification, notificationContextHolder] =
    notificationModule.useNotification();
  const [editUserModal, editUserModalContextHolder] = Modal.useModal();
  const [editUserForm] = Form.useForm();
  const [newPassword, setNewPassword] = useState("");

  const newPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // if ((e.nativeEvent as InputEvent).isComposing) {
    //   return;
    // }
    setNewPassword(e.target.value.trim());
  };

  const handleUserEdit = (method: "POST" | "PUT", record: User | undefined) => {
    editUserModal.confirm({
      title: "编辑用户",
      content: (
        <Form
          form={editUserForm}
          labelCol={{ span: 7 }}
          wrapperCol={{ span: 28 }}
          layout="horizontal"
          autoComplete="off"
          initialValues={record}
          preserve={false}
        >
          <Form.Item name="id" label="id" rules={[{ required: true }]}>
            <Input disabled />
          </Form.Item>
          <Form.Item name="name" label="name">
            <Input disabled />
          </Form.Item>
          <Form.Item name="username" label="username">
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item name="gh_username" label="gh_username">
            <Input disabled />
          </Form.Item>
          <Form.Item name="email" label="email">
            <Input />
          </Form.Item>
          <Form.Item name="emailVerified" label="emailVerified">
            <Input disabled />
          </Form.Item>
          <Form.Item name="createdAt" label="createdAt">
            <Input disabled />
          </Form.Item>
          <Form.Item name="updatedAt" label="updatedAt">
            <Input disabled />
          </Form.Item>
          <Form.Item
            name="allowToLogin"
            label="allowToLogin"
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
          <Form.Item name="isAdmin" label="isAdmin" valuePropName="checked">
            <Checkbox />
          </Form.Item>

          <Form.Item name="password" label="password">
            <Input
              prefix={<LockOutlined className="site-form-item-icon" />}
              type="password"
              placeholder="Password"
              autoComplete="new-password"
            />
          </Form.Item>
        </Form>
      ),
      onOk: () => {
        const setting_key = method === "PUT" ? record?.id : "";
        editUserForm.validateFields().then((values) => {
          const dataToSubmit = {
            username: values.username ?? null,
            email: values.email ?? null,
            allowToLogin: values.allowToLogin ?? true,
            isAdmin: values.isAdmin ?? false,
            password: values.password ?? null,
          };
          fetch(`/api/admin/users/${values.id}`, {
            method: method,
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataToSubmit),
          })
            .then((response) => response.json())
            .then((result) => {
              if (result["result"] == "ok") {
                openNotification("info", {
                  message: "修改信息",
                  description: `${values.id} 信息修改成功`,
                });
              }
            })
            .catch((error) => {
              console.log("e", error);
              openNotification("error", {
                message: "修改信息",
                description: `${values.id} 信息修改失败`,
              });
            });
        });
      },
    });
  };

  const confirmPassword = async (id: string) => {
    console.log("-----", newPassword, id);
    try {
      fetch(`/api/admin/users/${id}`, {
        method: "put",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: newPassword,
        }),
        credentials: "include",
      })
        .then((response) => response.json())
        .then((res) => {
          if (res["result"] == "ok") {
            openNotification("info", {
              message: "修改密码",
              description: `${id} 密码修改成功`,
            });
          }
        })
        .catch((error) => {
          console.log("e", error);
          openNotification("error", {
            message: "修改密码",
            description: `${id} 密码修改失败`,
          });
        });
    } catch {
      openNotification("error", {
        message: "修改密码",
        description: `${id} 密码修改失败`,
      });
    }
    setNewPassword("");
  };

  const openNotification = (level: string, arms: NotificationArgsProps) => {
    if (level === "error") {
      notification.error({
        ...arms,
        placement: "topRight",
      });
    } else {
      notification.info({
        ...arms,
        placement: "topRight",
      });
    }
  };
  const handleDeleteUser = (record: User) => {
    fetch(`/api/admin/users/${record.id}`, { method: "delete" })
      .then((response) => {
        console.log("delete, ", record);
        if (response.ok) {
          openNotification("info", {
            message: "删除用户",
            description: `${record.email || record.name} 删除成功`,
          });
        } else {
          openNotification("error", {
            message: "删除用户",
            description: `${record.email || record.name} 删除失败`,
          });
        }
      })
      .catch((reason) => {
        openNotification("error", {
          message: "删除用户",
          description: `${record.email || record.name} 删除失败\n${reason}`,
        });
      });
  };
  const columns: TableColumnsType<User> = [
    { title: "Name", dataIndex: "name" },
    {
      title: "UserName",
      dataIndex: "username",
    },
    { title: "Email", dataIndex: "email" },
    {
      title: "createdAt",
      dataIndex: "createdAt",
      render: (value) => getCurrentTime(new Date(value)),
      sorter: (a, b) => {
        if (a.createdAt < b.createdAt) return 1;
        return -1;
      },
    },
    {
      title: "updatedAt",
      dataIndex: "updatedAt",
      render: (value) => getCurrentTime(new Date(value)),
    },
    {
      title: "管理员",
      dataIndex: "isAdmin",
      width: 80,
      render: (value) => {
        return (
          <div>
            <Checkbox defaultChecked={value} disabled></Checkbox>
          </div>
        );
      },
    },
    {
      title: "允许登录",
      dataIndex: "allowToLogin",
      width: 80,
      render: (value) => {
        return (
          <div>
            <Checkbox defaultChecked={value} disabled></Checkbox>
          </div>
        );
      },
    },
    // {
    //   title: "编辑",
    //   dataIndex: "",
    //   key: "id",
    //   width: 80,
    //   render: (value) => {
    //     return (
    //       <div>
    //         <a >编辑</a>
    //       </div>
    //     );
    //   },
    // },
    {
      title: "Action",
      dataIndex: "",
      key: "id",
      render: (_, record) => (
        <Space size="small">
          <a type="link" onClick={() => handleUserEdit("PUT", record)}>
            编辑
          </a>
          <Popconfirm
            id="user-admin-table-pop_confirm"
            title="设置密码"
            description={
              <>
                <Input.Password
                  autoComplete="new-password"
                  value={newPassword}
                  onCompositionStart={(e) => e.preventDefault()}
                  onChange={newPasswordChange}
                />
              </>
            }
            onConfirm={() => confirmPassword(record.id)}
            onOpenChange={() => console.log("open change")}
          >
            <Button type="primary" size="small">
              设置密码
            </Button>
          </Popconfirm>
          <a onClick={() => handleDeleteUser(record)}>删除</a>
        </Space>
      ),
    },
  ];
  // console.log(users, "users2");

  return (
    <>
      {notificationContextHolder}
      {editUserModalContextHolder}
      <Table
        dataSource={users}
        rowKey="id"
        columns={columns}
        loading={loading as boolean}
        scroll={{
          scrollToFirstRowOnChange: true,
          y: 1080,
        }}
      />
    </>
  );
}

function UsersTablePart() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <>
      <UserTableSearchInput
        users={users}
        setUsers={setUsers}
        loading={loading}
        setLoading={setLoading}
      />
      <UsersTable
        users={users}
        setUsers={setUsers}
        loading={loading}
        setLoading={setLoading}
      />
    </>
  );
}

export default UsersTablePart;
