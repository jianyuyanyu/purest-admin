<script setup lang="ts">
import { ref, onBeforeMount } from "vue";
import { ElTreeSelect } from "element-plus";
import { getOrganizationTreeData } from "#/api";

const value = ref();
const data = ref();

onBeforeMount(async () => {
  const treeData = await getOrganizationTreeData();
  data.value = treeData;
});
</script>

<template>
  <el-tree-select
    v-model="value"
    check-strictly
    style="width: 100%"
    :data="data"
    :props="{
      value: 'id',
      label: 'name',
      children: 'children'
    }"
    :render-after-expand="false"
  />
</template>
